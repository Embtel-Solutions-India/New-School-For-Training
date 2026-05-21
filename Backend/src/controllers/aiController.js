import { v4 as uuidv4 } from "uuid";
import AIChatHistory from "../models/AIChatHistory.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import LectureSummary from "../models/LectureSummary.js";
import VoiceHistory from "../models/VoiceHistory.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatWithGemini, sanitizeInput, generateLectureSummaryWithGemini } from "../services/geminiService.js";

export const chat = asyncHandler(async (req, res) => {
  const { message, sessionId, courseId, lessonId, preferredLanguage } = req.body;

  let cleanMessage;
  try {
    cleanMessage = sanitizeInput(message);
  } catch (err) {
    if (err.message === "INJECTION_DETECTED") throw new ApiError(400, "Invalid message content");
    if (err.message === "EMPTY_INPUT") throw new ApiError(400, "Message cannot be empty");
    throw new ApiError(400, "Invalid message");
  }

  // Resolve language: body param > user profile
  let language = preferredLanguage || "en";
  if (!["en", "hi", "es", "fr"].includes(language)) language = "en";

  // Fetch user's preferredLanguage from DB as fallback
  if (!preferredLanguage) {
    const userLang = await User.findById(req.user._id).select("preferredLanguage").lean();
    if (userLang?.preferredLanguage) language = userLang.preferredLanguage;
  }

  let courseTitle = "";
  let lessonTitle = "";
  let lessonDescription = "";

  if (courseId) {
    const enrolled = await Enrollment.exists({ user: req.user._id, course: courseId });
    if (enrolled) {
      const course = await Course.findById(courseId).select("title curriculum.lessons").lean();
      if (course) {
        courseTitle = course.title;
        if (lessonId) {
          const lesson = course.curriculum?.lessons?.find((l) => l._id.toString() === lessonId);
          if (lesson) {
            lessonTitle = lesson.title || "";
            lessonDescription = lesson.description || "";
          }
        }
      }
    }
  }

  let session = null;
  if (sessionId) {
    session = await AIChatHistory.findOne({ sessionId, student: req.user._id });
  }
  if (!session) {
    session = new AIChatHistory({
      student: req.user._id,
      sessionId: uuidv4(),
      course: courseId || undefined,
      courseTitle,
      messages: [],
      title: cleanMessage.slice(0, 80),
    });
  }

  let aiResponse;
  try {
    aiResponse = await chatWithGemini({
      message: cleanMessage,
      history: session.messages,
      courseTitle,
      lessonTitle,
      lessonDescription,
      preferredLanguage: language,
    });
  } catch (err) {
    if (err.message === "AI_NOT_CONFIGURED") {
      throw new ApiError(503, "AI assistant is not configured. Please add GEMINI_API_KEY to the environment.");
    }

    console.error("[AI] Gemini error details:", err);

    const is429 = err?.status === 429 || err?.message?.includes("429");
    const is503 = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("overloaded");

    if (is429) throw new ApiError(429, "Free tier quota exceeded. Please wait a minute before sending another message.");
    if (is503) throw new ApiError(503, "Gemini free servers are busy right now. Please try again in a few seconds.");

    throw new ApiError(500, "Something went wrong with the AI assistant.");
  }

  const now = new Date();
  session.messages.push(
    { role: "user", content: cleanMessage, timestamp: now },
    { role: "assistant", content: aiResponse, timestamp: now }
  );
  if (session.messages.length > 50) {
    session.messages = session.messages.slice(-50);
  }

  await session.save();

  res.json({
    success: true,
    sessionId: session.sessionId,
    response: aiResponse,
    messages: session.messages,
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const sessions = await AIChatHistory.find({ student: req.user._id })
    .select("sessionId title courseTitle messages createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
  res.json({ success: true, sessions });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await AIChatHistory.findOne({
    sessionId: req.params.sessionId,
    student: req.user._id,
  }).lean();
  if (!session) throw new ApiError(404, "Session not found");
  res.json({ success: true, session });
});

export const deleteSession = asyncHandler(async (req, res) => {
  await AIChatHistory.findOneAndDelete({ sessionId: req.params.sessionId, student: req.user._id });
  res.json({ success: true });
});

export const generateLessonSummary = asyncHandler(async (req, res) => {
  const { courseId, lessonId, language = "en" } = req.body;
  if (!courseId || !lessonId) throw new ApiError(400, "courseId and lessonId are required");

  const lang = ["en", "hi", "es", "fr"].includes(language) ? language : "en";

  // Return cached summary if exists
  const cached = await LectureSummary.findOne({ lessonId, language: lang }).lean();
  if (cached) {
    return res.json({ success: true, summary: cached, cached: true });
  }

  // Verify enrollment
  const enrolled = await Enrollment.exists({ user: req.user._id, course: courseId });
  if (!enrolled) throw new ApiError(403, "You are not enrolled in this course");

  const course = await Course.findById(courseId).select("title curriculum.lessons").lean();
  if (!course) throw new ApiError(404, "Course not found");

  const lesson = course.curriculum?.lessons?.find((l) => l._id.toString() === lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  let parsed;
  try {
    parsed = await generateLectureSummaryWithGemini({
      lessonTitle: lesson.title,
      lessonDescription: lesson.description || "",
      courseTitle: course.title,
      language: lang,
    });
  } catch (err) {
    if (err.message === "AI_NOT_CONFIGURED") throw new ApiError(503, "AI is not configured");
    throw new ApiError(500, "Failed to generate summary");
  }

  const lectureSummary = await LectureSummary.create({
    lessonId,
    courseId,
    generatedBy: req.user._id,
    summary: parsed.summary,
    keyPoints: parsed.keyPoints || [],
    quizSuggestions: parsed.quizSuggestions || [],
    language: lang,
  });

  res.status(201).json({ success: true, summary: lectureSummary, cached: false });
});

export const getLessonSummary = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const lang = ["en", "hi", "es", "fr"].includes(req.query.language) ? req.query.language : "en";

  const summary = await LectureSummary.findOne({ lessonId, language: lang }).lean();
  if (!summary) return res.json({ success: true, summary: null });

  res.json({ success: true, summary });
});

export const voiceChat = asyncHandler(async (req, res) => {
  const { transcript, language = "en", courseId, sessionId } = req.body;

  if (!transcript?.trim()) throw new ApiError(400, "Transcript is required");

  let cleanTranscript;
  try {
    cleanTranscript = sanitizeInput(transcript);
  } catch (err) {
    if (err.message === "INJECTION_DETECTED") throw new ApiError(400, "Invalid voice input");
    if (err.message === "EMPTY_INPUT") throw new ApiError(400, "Voice transcript is empty");
    throw new ApiError(400, "Invalid input");
  }

  const lang = ["en", "hi", "es", "fr"].includes(language) ? language : "en";

  let courseTitle = "";
  if (courseId) {
    const enrolled = await Enrollment.exists({ user: req.user._id, course: courseId });
    if (enrolled) {
      const course = await Course.findById(courseId).select("title").lean();
      if (course) courseTitle = course.title;
    }
  }

  let aiResponse;
  try {
    aiResponse = await chatWithGemini({
      message: cleanTranscript,
      history: [],
      courseTitle,
      preferredLanguage: lang,
    });
  } catch (err) {
    if (err.message === "AI_NOT_CONFIGURED") throw new ApiError(503, "AI is not configured");
    throw new ApiError(500, "Voice AI request failed");
  }

  VoiceHistory.create({
    student: req.user._id,
    transcript: cleanTranscript,
    response: aiResponse,
    language: lang,
    courseId: courseId || undefined,
    sessionId: sessionId || undefined,
  }).catch(() => {});

  res.json({ success: true, response: aiResponse, transcript: cleanTranscript });
});

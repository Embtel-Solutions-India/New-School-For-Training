import { v4 as uuidv4 } from "uuid";
import AIChatHistory from "../models/AIChatHistory.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatWithGemini, sanitizeInput } from "../services/geminiService.js";

export const chat = asyncHandler(async (req, res) => {
  const { message, sessionId, courseId, lessonId } = req.body;

  // Validate + sanitize input
  let cleanMessage;
  try {
    cleanMessage = sanitizeInput(message);
  } catch (err) {
    if (err.message === "INJECTION_DETECTED") throw new ApiError(400, "Invalid message content");
    if (err.message === "EMPTY_INPUT") throw new ApiError(400, "Message cannot be empty");
    throw new ApiError(400, "Invalid message");
  }

  // Resolve course/lesson context (only if student is enrolled)
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

  // Find or create session
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

  // Call Gemini with conversation history
  let aiResponse;
  try {
    aiResponse = await chatWithGemini({
      message: cleanMessage,
      history: session.messages,
      courseTitle,
      lessonTitle,
      lessonDescription,
    });
  } catch (err) {
    if (err.message === "AI_NOT_CONFIGURED") {
      throw new ApiError(503, "AI assistant is not configured. Please add GEMINI_API_KEY to the environment.");
    }

    console.error("[AI] Gemini error details:", err);

    // Explicitly catch free tier errors (Rate limits 429 or Server Overload 503)
    const is429 = err?.status === 429 || err?.message?.includes("429");
    const is503 = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("overloaded");

    if (is429) {
      throw new ApiError(429, "Free tier quota exceeded. Please wait a minute before sending another message.");
    }
    if (is503) {
      throw new ApiError(503, "Gemini free servers are busy right now. We are retrying your request—please try sending again in a few seconds.");
    }

    throw new ApiError(500, "Something went wrong with the AI assistant.");
  }

  // Persist messages (cap at 50 messages per session)
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

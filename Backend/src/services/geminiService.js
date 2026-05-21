import { GoogleGenerativeAI } from "@google/generative-ai";

const isConfigured = () => !!process.env.GEMINI_API_KEY;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|previous\s+|prior\s+)?instructions/i,
  /forget\s+(everything|all|your\s+instructions)/i,
  /you\s+are\s+now\s+(a\s+|an\s+)?(?!teacher|tutor|assistant|helpful)/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|system\|>|<\|user\|>|<\|assistant\|>/i,
  /###\s*(system|instruction)/i,
];

export const sanitizeInput = (text) => {
  if (typeof text !== "string") throw new Error("INVALID_INPUT");
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) throw new Error("EMPTY_INPUT");
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) throw new Error("INJECTION_DETECTED");
  }
  return trimmed;
};

const LANGUAGE_NAMES = { en: "English", hi: "Hindi", es: "Spanish", fr: "French" };

const buildSystemInstruction = ({ courseTitle, lessonTitle, lessonDescription, preferredLanguage }) => {
  let ctx = "";
  if (courseTitle) ctx += `\n- Course: ${courseTitle}`;
  if (lessonTitle) ctx += `\n- Current Lesson: ${lessonTitle}`;
  if (lessonDescription) ctx += `\n- Lesson Overview: ${lessonDescription}`;

  const langName = LANGUAGE_NAMES[preferredLanguage] || "English";
  const langInstruction = preferredLanguage && preferredLanguage !== "en"
    ? `\n\nIMPORTANT: Always respond in ${langName}. The student's preferred language is ${langName}.`
    : "";

  return `You are a helpful AI teaching assistant for SFT Learning, an online education platform.

Current learning context:${ctx || "\n- No specific course selected"}

Your responsibilities:
- Answer student questions clearly with educational depth
- Explain concepts simply using relatable examples
- Summarize lesson content when asked
- Generate practice questions on request
- Explain code snippets relevant to the course material
- Provide encouragement and study tips
- Keep answers concise but thorough (aim for under 400 words)
- Format with line breaks and structure for readability

Important: Stay focused on educational topics. If a question is unrelated to learning, politely guide the student back to their coursework.${langInstruction}`;
};

export const chatWithGemini = async ({
  message,
  history = [],
  courseTitle = "",
  lessonTitle = "",
  lessonDescription = "",
  preferredLanguage = "en",
}) => {
  if (!isConfigured()) throw new Error("AI_NOT_CONFIGURED");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemInstruction({ courseTitle, lessonTitle, lessonDescription, preferredLanguage }),
  });

  const geminiHistory = history.slice(-20).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: geminiHistory,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  });

  const result = await chat.sendMessage(message);
  const text = result.response.text();
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
};

export const generateLectureSummaryWithGemini = async ({ lessonTitle, lessonDescription, courseTitle, language = "en" }) => {
  if (!isConfigured()) throw new Error("AI_NOT_CONFIGURED");

  const langName = LANGUAGE_NAMES[language] || "English";
  const langNote = language !== "en" ? ` Respond entirely in ${langName}.` : "";

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert educational content summarizer. Given the following lesson information, generate a structured summary.

Course: ${courseTitle || "General Course"}
Lesson: ${lessonTitle || "Untitled Lesson"}
Description: ${lessonDescription || "No description provided"}

Please provide:
1. A concise summary (2-3 paragraphs) of what this lesson covers
2. 5-7 key points the student should remember (as a list)
3. 3-5 quiz/review questions to test understanding

Format your response as JSON with this structure:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "quizSuggestions": ["question1", "question2", ...]
}${langNote}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("EMPTY_RESPONSE");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("INVALID_RESPONSE_FORMAT");

  return JSON.parse(jsonMatch[0]);
};

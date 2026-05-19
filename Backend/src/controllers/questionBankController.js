import QuestionBank from "../models/QuestionBank.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getQuestions = asyncHandler(async (req, res) => {
  const { type, difficulty, subject, search, tags, page = 1, limit = 30 } = req.query;
  const filter = { teacher: req.user._id };
  if (type) filter.type = type;
  if (difficulty) filter.difficulty = difficulty;
  if (subject) filter.subject = { $regex: subject, $options: "i" };
  if (search) filter.question = { $regex: search, $options: "i" };
  if (tags) filter.tags = { $in: tags.split(",").map((t) => t.trim()) };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [questions, total] = await Promise.all([
    QuestionBank.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    QuestionBank.countDocuments(filter),
  ]);

  res.json({ success: true, questions, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { question, type, options, correctAnswer, explanation, difficulty, subject, tags } = req.body;
  if (!question?.trim()) throw new ApiError(400, "Question text is required");

  const q = await QuestionBank.create({
    teacher: req.user._id,
    question: question.trim(),
    type: type || "mcq",
    options: options || [],
    correctAnswer: correctAnswer?.trim() || "",
    explanation: explanation?.trim() || "",
    difficulty: difficulty || "medium",
    subject: subject?.trim() || "General",
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : []),
  });

  res.status(201).json({ success: true, question: q });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const q = await QuestionBank.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!q) throw new ApiError(404, "Question not found");

  const allowed = ["question", "type", "options", "correctAnswer", "explanation", "difficulty", "subject", "tags"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) q[f] = req.body[f]; });
  await q.save();
  res.json({ success: true, question: q });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const q = await QuestionBank.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!q) throw new ApiError(404, "Question not found");
  await q.deleteOne();
  res.json({ success: true, message: "Question deleted" });
});

export const getQuestionStats = asyncHandler(async (req, res) => {
  const stats = await QuestionBank.aggregate([
    { $match: { teacher: req.user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: { type: "$type", difficulty: "$difficulty" },
        },
      },
    },
  ]);

  const byType = await QuestionBank.aggregate([
    { $match: { teacher: req.user._id } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  const byDifficulty = await QuestionBank.aggregate([
    { $match: { teacher: req.user._id } },
    { $group: { _id: "$difficulty", count: { $sum: 1 } } },
  ]);

  res.json({ success: true, stats: { total: stats[0]?.total || 0, byType, byDifficulty } });
});

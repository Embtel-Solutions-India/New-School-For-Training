import Submission from "../models/Submission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitToUsers } from "../services/socketService.js";

// ── Teacher: list submissions for a specific assignment ────────────────────────

export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const { courseId, assignmentId } = req.params;

  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(404, "Course not found");

  const assignment = course.curriculum.assignments.id(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const submissions = await Submission.find({ course: courseId, assignmentId })
    .populate("student", "name email avatar")
    .sort({ submittedAt: -1 })
    .lean();

  const total = submissions.length;
  const graded = submissions.filter((s) => s.status === "graded").length;
  const pending = submissions.filter((s) => s.status === "submitted").length;

  res.json({
    success: true,
    submissions,
    assignment: {
      _id: assignment._id,
      title: assignment.title,
      maxScore: assignment.maxScore,
      dueDate: assignment.dueDate,
      instructions: assignment.instructions,
    },
    stats: { total, graded, pending },
  });
});

// ── Teacher: grade a submission ────────────────────────────────────────────────

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback, status = "graded" } = req.body;

  if (!["graded", "resubmit"].includes(status)) throw new ApiError(400, "Invalid status");

  const submission = await Submission.findById(submissionId)
    .populate("student", "name email _id")
    .populate("course", "title teacher");

  if (!submission) throw new ApiError(404, "Submission not found");

  if (submission.course.teacher.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to grade this submission");
  }

  if (score !== undefined && (isNaN(score) || score < 0 || score > submission.maxScore)) {
    throw new ApiError(400, `Score must be between 0 and ${submission.maxScore}`);
  }

  if (score !== undefined) submission.score = score;
  if (feedback !== undefined) submission.feedback = feedback;
  submission.status = status;
  submission.gradedAt = new Date();
  await submission.save();

  const studentId = submission.student._id;
  const isResubmit = status === "resubmit";
  const notifTitle = isResubmit ? "Resubmission Requested" : "Assignment Graded";
  const notifMsg = isResubmit
    ? `Your submission for "${submission.assignmentTitle}" needs revision. Please resubmit.`
    : `Your assignment "${submission.assignmentTitle}" was graded. Score: ${submission.score}/${submission.maxScore}.`;

  // Notify student (fire-and-forget)
  Notification.create({
    title: notifTitle,
    message: notifMsg,
    type: isResubmit ? "alert" : "success",
    targetAudience: "specific",
    targetUsers: [studentId],
    sentBy: req.user._id,
    isActive: true,
  }).catch(() => {});

  emitToUsers([studentId], "assignment-graded", {
    submissionId: submission._id,
    assignmentTitle: submission.assignmentTitle,
    courseTitle: submission.course.title,
    score: submission.score,
    maxScore: submission.maxScore,
    status,
    feedback: submission.feedback,
  });

  res.json({ success: true, submission });
});

// ── Teacher: list all submissions across courses ───────────────────────────────

export const getPendingSubmissions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const courses = await Course.find({ teacher: req.user._id }).select("_id title").lean();
  const courseIds = courses.map((c) => c._id);

  const filter = { course: { $in: courseIds } };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate("student", "name email avatar")
      .populate("course", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Submission.countDocuments(filter),
  ]);

  res.json({
    success: true,
    submissions,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ── Teacher: quiz attempt analytics for a quiz ─────────────────────────────────

export const getQuizAttempts = asyncHandler(async (req, res) => {
  const { courseId, quizId } = req.params;

  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(404, "Course not found");

  const quiz = course.curriculum.quizzes.id(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  const attempts = await QuizAttempt.find({ course: courseId, quizId })
    .populate("student", "name email avatar")
    .sort({ createdAt: -1 })
    .lean();

  const total = attempts.length;
  const passCount = attempts.filter((a) => a.passed).length;
  const avgScore = total > 0 ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / total) : 0;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  res.json({
    success: true,
    attempts,
    quiz: { _id: quiz._id, title: quiz.title, passingScore: quiz.passingScore, questions: quiz.questions?.length || 0 },
    stats: { total, passCount, passRate, avgScore },
  });
});

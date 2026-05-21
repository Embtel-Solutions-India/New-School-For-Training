import mongoose from "mongoose";
import Review from "../models/Review.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitToUsers } from "../services/socketService.js";

const recalcCourseRating = async (courseId) => {
  const [result] = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isPublic: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = result?.avg ? parseFloat(result.avg.toFixed(1)) : 0;
  const count = result?.count || 0;
  await Course.findByIdAndUpdate(courseId, { averageRating: avg, reviewCount: count });
  return { avg, count };
};

// ── Teacher: list own reviews ──────────────────────────────────────
export const getTeacherReviews = asyncHandler(async (req, res) => {
  const { courseId, rating, page = 1, limit = 20 } = req.query;
  const filter = { teacher: req.user._id };
  if (courseId) filter.course = courseId;
  if (rating) filter.rating = parseInt(rating);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [reviews, total, ratingBreakdown] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("student", "name avatar email")
      .populate("course", "title thumbnail"),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { teacher: req.user._id } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  const avgResult = await Review.aggregate([
    { $match: { teacher: req.user._id } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);

  res.json({
    success: true,
    reviews,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    stats: {
      avgRating: avgResult[0]?.avg ? parseFloat(avgResult[0].avg.toFixed(1)) : 0,
      total,
      breakdown: ratingBreakdown,
    },
  });
});

// ── Teacher: reply to a review ─────────────────────────────────────
export const replyToReview = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply?.trim()) throw new ApiError(400, "Reply content is required");

  const review = await Review.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!review) throw new ApiError(404, "Review not found");

  review.teacherReply = reply.trim();
  review.teacherRepliedAt = new Date();
  await review.save();

  res.json({ success: true, review });
});

// ── Teacher: remove own reply ──────────────────────────────────────
export const deleteReviewReply = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!review) throw new ApiError(404, "Review not found");
  review.teacherReply = "";
  review.teacherRepliedAt = null;
  await review.save();
  res.json({ success: true, review });
});

// ── Teacher: feature / unfeature a review ─────────────────────────
export const featureReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, teacher: req.user._id })
    .populate("course", "title");
  if (!review) throw new ApiError(404, "Review not found");

  review.isFeatured = !review.isFeatured;
  await review.save();

  if (review.isFeatured) {
    Notification.create({
      title: "Your Review Was Featured 🏆",
      message: `Your review for "${review.course.title}" was selected as a featured review!`,
      type: "success",
      targetAudience: "specific",
      targetUsers: [review.student],
      sentBy: req.user._id,
    }).catch(() => {});
    emitToUsers([review.student], "review-featured", {
      courseTitle: review.course.title,
      reviewId: review._id,
    });
  }

  res.json({ success: true, review });
});

// ── Student: submit or update own review ──────────────────────────
export const submitReview = asyncHandler(async (req, res) => {
  const { courseId, rating, comment } = req.body;
  if (!courseId || !rating) throw new ApiError(400, "Course and rating are required");
  const ratingNum = parseInt(rating);
  if (ratingNum < 1 || ratingNum > 5) throw new ApiError(400, "Rating must be between 1 and 5");

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id,
    status: { $in: ["active", "completed"] },
  });
  if (!enrollment) throw new ApiError(403, "You must be enrolled in this course to leave a review");
  // Optional progress gate (uncomment to require 20% completion):
  // if (enrollment.progress < 20) throw new ApiError(403, "Complete at least 20% of the course to leave a review");

  const isNew = !(await Review.exists({ course: courseId, student: req.user._id }));

  const review = await Review.findOneAndUpdate(
    { course: courseId, student: req.user._id },
    { teacher: course.teacher, rating: ratingNum, comment: comment?.trim() || "", isPublic: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recalcCourseRating(courseId);

  if (isNew) {
    Notification.create({
      title: "New Review Received ⭐",
      message: `${req.user.name} rated "${course.title}" ${ratingNum} star${ratingNum !== 1 ? "s" : ""}.`,
      type: "info",
      targetAudience: "specific",
      targetUsers: [course.teacher],
      sentBy: req.user._id,
    }).catch(() => {});
    emitToUsers([course.teacher], "review-added", {
      courseId,
      courseTitle: course.title,
      studentName: req.user.name,
      rating: ratingNum,
    });
  }

  res.status(201).json({ success: true, review });
});

// ── Student: delete own review ─────────────────────────────────────
export const deleteStudentReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, student: req.user._id });
  if (!review) throw new ApiError(404, "Review not found");
  const courseId = review.course;
  await review.deleteOne();
  await recalcCourseRating(courseId);
  res.json({ success: true });
});

// ── Student: list own reviews ──────────────────────────────────────
export const getStudentReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate("course", "title thumbnail");
  res.json({ success: true, reviews });
});

// ── Public: reviews for a course (course detail page) ─────────────
export const getPublicCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { course: courseId, isPublic: true };

  const [reviews, total, breakdownAgg, avgAgg] = await Promise.all([
    Review.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("student", "name avatar"),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId), isPublic: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId), isPublic: true } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]),
  ]);

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  breakdownAgg.forEach((b) => { breakdown[b._id] = b.count; });

  res.json({
    success: true,
    reviews,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    stats: {
      avgRating: avgAgg[0]?.avg ? parseFloat(avgAgg[0].avg.toFixed(1)) : 0,
      total,
      breakdown,
    },
  });
});

// ── Public: top/featured reviews for landing page ─────────────────
export const getTopReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isPublic: true, comment: { $ne: "" } })
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
    .limit(6)
    .populate("student", "name avatar")
    .populate("course", "title");
  res.json({ success: true, reviews });
});

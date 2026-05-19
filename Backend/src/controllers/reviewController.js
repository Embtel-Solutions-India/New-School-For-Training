import Review from "../models/Review.js";
import Course from "../models/Course.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

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

  const avgRating = await Review.aggregate([
    { $match: { teacher: req.user._id } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);

  res.json({
    success: true,
    reviews,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    stats: {
      avgRating: avgRating[0]?.avg ? parseFloat(avgRating[0].avg.toFixed(1)) : 0,
      total,
      breakdown: ratingBreakdown,
    },
  });
});

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

export const deleteReviewReply = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!review) throw new ApiError(404, "Review not found");
  review.teacherReply = "";
  review.teacherRepliedAt = null;
  await review.save();
  res.json({ success: true, review });
});

// Students submit reviews
export const submitReview = asyncHandler(async (req, res) => {
  const { courseId, rating, comment } = req.body;
  if (!courseId || !rating) throw new ApiError(400, "Course and rating required");

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const review = await Review.findOneAndUpdate(
    { course: courseId, student: req.user._id },
    { teacher: course.teacher, rating, comment: comment?.trim() || "", isPublic: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, review });
});

import Discussion from "../models/Discussion.js";
import Course from "../models/Course.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const isCourseOwner = async (courseId, teacherId) => {
  const course = await Course.findOne({ _id: courseId, teacher: teacherId });
  if (!course) throw new ApiError(403, "Not authorized for this course");
  return course;
};

export const getCourseDiscussions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await isCourseOwner(courseId, req.user._id);

  const { page = 1, limit = 20, search, pinned } = req.query;
  const filter = { course: courseId, parentComment: null, isDeleted: false };
  if (search) filter.content = { $regex: search, $options: "i" };
  if (pinned === "true") filter.isPinned = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [posts, total] = await Promise.all([
    Discussion.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "name avatar role"),
    Discussion.countDocuments(filter),
  ]);

  // Fetch replies for top-level posts
  const postIds = posts.map((p) => p._id);
  const replies = await Discussion.find({ parentComment: { $in: postIds }, isDeleted: false })
    .populate("author", "name avatar role")
    .sort({ createdAt: 1 });

  const replyMap = {};
  replies.forEach((r) => {
    const key = r.parentComment.toString();
    if (!replyMap[key]) replyMap[key] = [];
    replyMap[key].push(r);
  });

  const result = posts.map((p) => ({
    ...p.toObject(),
    replies: replyMap[p._id.toString()] || [],
  }));

  res.json({ success: true, discussions: result, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

export const replyToDiscussion = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw new ApiError(400, "Content is required");

  const parent = await Discussion.findById(req.params.id);
  if (!parent) throw new ApiError(404, "Discussion not found");
  await isCourseOwner(parent.course, req.user._id);

  const reply = await Discussion.create({
    course: parent.course,
    author: req.user._id,
    content: content.trim(),
    parentComment: parent._id,
  });

  parent.replyCount = (parent.replyCount || 0) + 1;
  await parent.save();

  const populated = await reply.populate("author", "name avatar role");
  res.status(201).json({ success: true, reply: populated });
});

export const pinDiscussion = asyncHandler(async (req, res) => {
  const post = await Discussion.findById(req.params.id);
  if (!post) throw new ApiError(404, "Discussion not found");
  await isCourseOwner(post.course, req.user._id);

  post.isPinned = !post.isPinned;
  await post.save();
  res.json({ success: true, discussion: post });
});

export const deleteDiscussion = asyncHandler(async (req, res) => {
  const post = await Discussion.findById(req.params.id);
  if (!post) throw new ApiError(404, "Discussion not found");
  await isCourseOwner(post.course, req.user._id);

  post.isDeleted = true;
  post.deletedBy = req.user._id;
  post.deletedAt = new Date();
  await post.save();
  res.json({ success: true, message: "Post removed" });
});

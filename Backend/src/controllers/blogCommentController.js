import BlogComment from "../models/BlogComment.js";
import Blog from "../models/Blog.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getComments = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const comments = await BlogComment.find({ blog: blogId, isDeleted: false })
    .populate("author", "name avatar")
    .sort({ createdAt: 1 })
    .lean();

  // Nest replies under parents
  const topLevel = [];
  const map = {};
  comments.forEach((c) => {
    map[c._id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.parentComment) {
      if (map[c.parentComment]) map[c.parentComment].replies.push(map[c._id]);
    } else {
      topLevel.push(map[c._id]);
    }
  });

  res.json({ success: true, comments: topLevel });
});

export const createComment = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { content, parentComment } = req.body;

  if (!content?.trim()) throw new ApiError(400, "Comment content is required");

  const blog = await Blog.findOne({ _id: blogId, status: "published" });
  if (!blog) throw new ApiError(404, "Blog not found");

  if (parentComment) {
    const parent = await BlogComment.findOne({ _id: parentComment, blog: blogId, isDeleted: false });
    if (!parent) throw new ApiError(404, "Parent comment not found");
  }

  const comment = await BlogComment.create({
    blog: blogId,
    author: req.user._id,
    content: content.trim(),
    parentComment: parentComment || null,
  });

  await comment.populate("author", "name avatar");
  res.status(201).json({ success: true, comment });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await BlogComment.findOne({ _id: req.params.commentId, author: req.user._id, isDeleted: false });
  if (!comment) throw new ApiError(404, "Comment not found or not owned by you");

  const { content } = req.body;
  if (!content?.trim()) throw new ApiError(400, "Comment content is required");

  comment.content = content.trim();
  await comment.save();
  await comment.populate("author", "name avatar");
  res.json({ success: true, comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await BlogComment.findOne({
    _id: req.params.commentId,
    isDeleted: false,
    $or: [
      { author: req.user._id },
      // admins can delete any comment (checked by route middleware)
    ],
  });
  if (!comment) throw new ApiError(404, "Comment not found");

  const hasReplies = await BlogComment.exists({ parentComment: comment._id, isDeleted: false });
  if (hasReplies) {
    comment.isDeleted = true;
    comment.content = "[deleted]";
    await comment.save();
  } else {
    await comment.deleteOne();
  }

  res.json({ success: true, message: "Comment deleted" });
});

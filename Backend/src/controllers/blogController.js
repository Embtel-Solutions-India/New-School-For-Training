import Blog from "../models/Blog.js";
import BlogLike from "../models/BlogLike.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildSlug = (title = "") =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ── Public ─────────────────────────────────────────────────────────────
export const getPublicBlogs = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { status: "published" };
  if (search) filter.title = { $regex: search, $options: "i" };
  if (category) filter.category = category;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Blog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    blogs,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

export const getPublicBlogCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.distinct("category", { status: "published" });
  res.json({ success: true, categories: categories.filter(Boolean).sort() });
});

export const getPublicBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("author", "name avatar bio")
    .lean();

  if (!blog) throw new ApiError(404, "Blog not found");

  const related = await Blog.find({
    status: "published",
    category: blog.category,
    _id: { $ne: blog._id },
  })
    .populate("author", "name avatar")
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  res.json({ success: true, blog, related });
});

// ── Teacher ─────────────────────────────────────────────────────────────
export const getTeacherBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ success: true, blogs });
});

export const createBlog = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  if (!title) throw new ApiError(400, "Blog title is required");

  const baseSlug = req.body.slug?.trim() || buildSlug(title);
  const exists = await Blog.findOne({ slug: baseSlug });
  const slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug;

  const allowedStatuses = ["draft", "pending", "published"];
  const status = allowedStatuses.includes(req.body.status)
    ? req.body.status
    : "draft";

  const blog = await Blog.create({
    title,
    subtitle: req.body.subtitle,
    slug,
    shortDescription: req.body.shortDescription,
    content: req.body.content,
    featuredImage: req.body.featuredImage,
    category: req.body.category,
    tags: req.body.tags,
    author: req.user._id,
    status,
  });

  res.status(201).json({ success: true, blog });
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, author: req.user._id });
  if (!blog) throw new ApiError(404, "Blog not found or not owned by you");

  const allowed = [
    "title", "subtitle", "slug", "shortDescription", "content",
    "featuredImage", "category", "tags", "status",
  ];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) blog[f] = req.body[f];
  });

  await blog.save();
  res.json({ success: true, blog });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, author: req.user._id });
  if (!blog) throw new ApiError(404, "Blog not found or not owned by you");
  await blog.deleteOne();
  res.json({ success: true, message: "Blog deleted" });
});

export const submitForReview = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, author: req.user._id });
  if (!blog) throw new ApiError(404, "Blog not found or not owned by you");
  if (!["draft", "rejected"].includes(blog.status)) {
    throw new ApiError(400, "Only draft or rejected blogs can be submitted for review");
  }
  blog.status = "pending";
  blog.rejectionNote = "";
  await blog.save();
  res.json({ success: true, blog });
});

export const getBlogAnalytics = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id }).lean();
  const totalBlogs = blogs.length;
  const totalViews = blogs.reduce((s, b) => s + (b.views || 0), 0);
  const totalLikes = blogs.reduce((s, b) => s + (b.likes || 0), 0);
  const byStatus = blogs.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  res.json({ success: true, analytics: { totalBlogs, totalViews, totalLikes, byStatus } });
});

// ── Admin ─────────────────────────────────────────────────────────────────
export const getPendingBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ status: "pending" })
    .populate("author", "name avatar email")
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ success: true, blogs });
});

export const getAllBlogsAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = {};
  if (status) filter.status = status;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "name avatar email")
      .populate("approvedBy", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Blog.countDocuments(filter),
  ]);

  res.json({ success: true, blogs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const approveBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");
  if (blog.status !== "pending") throw new ApiError(400, "Blog is not pending review");

  blog.status = "published";
  blog.approvedBy = req.user._id;
  blog.publishedAt = new Date();
  blog.rejectionNote = "";
  await blog.save();
  res.json({ success: true, blog });
});

export const rejectBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");
  if (blog.status !== "pending") throw new ApiError(400, "Blog is not pending review");

  blog.status = "rejected";
  blog.rejectionNote = req.body.note || "";
  await blog.save();
  res.json({ success: true, blog });
});

export const adminDeleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");
  await blog.deleteOne();
  res.json({ success: true, message: "Blog deleted" });
});

// ── Likes ─────────────────────────────────────────────────────────────────
export const toggleLike = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, status: "published" });
  if (!blog) throw new ApiError(404, "Blog not found");

  const existing = await BlogLike.findOne({ blog: blog._id, user: req.user._id });
  if (existing) {
    await existing.deleteOne();
    blog.likes = Math.max(0, blog.likes - 1);
    await blog.save();
    return res.json({ success: true, liked: false, likes: blog.likes });
  }

  await BlogLike.create({ blog: blog._id, user: req.user._id });
  blog.likes += 1;
  await blog.save();
  res.json({ success: true, liked: true, likes: blog.likes });
});

export const getLikeStatus = asyncHandler(async (req, res) => {
  const liked = !!(await BlogLike.findOne({ blog: req.params.id, user: req.user._id }));
  res.json({ success: true, liked });
});

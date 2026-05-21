import { GoogleGenerativeAI } from "@google/generative-ai";
import Discussion from "../models/Discussion.js";
import Announcement from "../models/Announcement.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emitToUsers, getIo } from "../services/socketService.js";

const isEnrolledOrTeacher = async (courseId, userId) => {
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(404, "Course not found");
  if (course.teacher.toString() === userId.toString()) return { course, role: "teacher" };
  const enrollment = await Enrollment.findOne({ user: userId, course: courseId, status: "active" }).lean();
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");
  return { course, role: "student" };
};

const isTeacherOfCourse = async (courseId, teacherId) => {
  const course = await Course.findOne({ _id: courseId, teacher: teacherId }).lean();
  if (!course) throw new ApiError(403, "Not authorized for this course");
  return course;
};

// ── Student: list all course communities (enrolled courses)
export const getMyCommunities = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id, status: "active" })
    .populate("course", "title thumbnail")
    .lean();

  const communities = await Promise.all(
    enrollments.filter((e) => e.course).map(async (e) => {
      const [postCount, memberCount, latest] = await Promise.all([
        Discussion.countDocuments({ course: e.course._id, parentComment: null, isDeleted: false }),
        Enrollment.countDocuments({ course: e.course._id, status: "active" }),
        Discussion.findOne({ course: e.course._id, parentComment: null, isDeleted: false })
          .sort({ createdAt: -1 })
          .populate("author", "name")
          .select("title content createdAt author")
          .lean(),
      ]);
      return { courseId: e.course._id, title: e.course.title, thumbnail: e.course.thumbnail, postCount, memberCount, latest };
    })
  );

  res.json({ success: true, communities });
});

// ── Student + Teacher: get posts for a course
export const getCoursePosts = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await isEnrolledOrTeacher(courseId, req.user._id);

  const { page = 1, limit = 20, search, filter = "all" } = req.query;
  const query = { course: courseId, parentComment: null, isDeleted: false };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }
  if (filter === "questions") query.isQuestion = true;
  if (filter === "pinned") query.isPinned = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [posts, total] = await Promise.all([
    Discussion.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "name avatar role")
      .lean(),
    Discussion.countDocuments(query),
  ]);

  const uid = req.user._id.toString();
  const result = posts.map((p) => ({
    ...p,
    likedByMe: (p.likes || []).some((id) => id.toString() === uid),
    likeCount: (p.likes || []).length,
  }));

  res.json({ success: true, posts: result, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

// ── Student: create a post
export const createPost = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title = "", content, tags = [], isQuestion = false } = req.body;

  if (!content?.trim()) throw new ApiError(400, "Content is required");
  if (content.trim().length < 5) throw new ApiError(400, "Post is too short");

  const { course } = await isEnrolledOrTeacher(courseId, req.user._id);

  const post = await Discussion.create({
    course: courseId,
    author: req.user._id,
    title: title.trim().slice(0, 200),
    content: content.trim(),
    tags: tags.slice(0, 5),
    isQuestion,
    likes: [],
    views: 0,
  });

  const populated = await post.populate("author", "name avatar role");
  const postObj = { ...populated.toObject(), likedByMe: false, likeCount: 0 };

  // Emit to community room
  const io = getIo();
  if (io) io.to(`community:${courseId}`).emit("new-post", { post: postObj });

  // Notify teacher
  if (course.teacher) {
    emitToUsers([course.teacher.toString()], "community-new-post", {
      courseId, courseTitle: course.title, postTitle: title || "New post", authorName: req.user.name,
    });
  }

  res.status(201).json({ success: true, post: postObj });
});

// ── Student: get replies for a post (+ view increment)
export const getPostReplies = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Discussion.findById(postId).populate("author", "name avatar role").lean();
  if (!post || post.isDeleted) throw new ApiError(404, "Post not found");
  await isEnrolledOrTeacher(post.course, req.user._id);

  Discussion.findByIdAndUpdate(postId, { $inc: { views: 1 } }).exec().catch(() => {});

  const replies = await Discussion.find({ parentComment: postId, isDeleted: false })
    .sort({ createdAt: 1 })
    .populate("author", "name avatar role")
    .lean();

  const uid = req.user._id.toString();
  res.json({
    success: true,
    post: { ...post, likedByMe: (post.likes || []).some((id) => id.toString() === uid), likeCount: (post.likes || []).length },
    replies,
  });
});

// ── Student: reply to a post
export const replyToPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  if (!content?.trim()) throw new ApiError(400, "Content is required");

  const parent = await Discussion.findById(postId).populate("author", "_id name");
  if (!parent || parent.isDeleted) throw new ApiError(404, "Post not found");
  if (parent.isLocked) throw new ApiError(403, "This thread is locked");

  await isEnrolledOrTeacher(parent.course, req.user._id);

  const reply = await Discussion.create({
    course: parent.course,
    author: req.user._id,
    content: content.trim(),
    parentComment: parent._id,
  });

  parent.replyCount = (parent.replyCount || 0) + 1;
  await parent.save();

  const populated = await reply.populate("author", "name avatar role");
  const replyObj = populated.toObject();

  // Emit to community room
  const io = getIo();
  if (io) io.to(`community:${parent.course.toString()}`).emit("new-reply", { postId, reply: replyObj });

  // Notify post author
  const authorId = parent.author._id.toString();
  if (authorId !== req.user._id.toString()) {
    emitToUsers([authorId], "reply-to-post", { postId, postTitle: parent.title || "your post", replierName: req.user.name });
    Notification.create({
      title: "💬 New reply on your post",
      message: `${req.user.name} replied to your discussion post.`,
      type: "info",
      targetAudience: "specific",
      targetUsers: [parent.author._id],
      sentBy: req.user._id,
      isActive: true,
    }).catch(() => {});
  }

  res.status(201).json({ success: true, reply: replyObj });
});

// ── Student: toggle like
export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Discussion.findById(postId);
  if (!post || post.isDeleted) throw new ApiError(404, "Post not found");
  await isEnrolledOrTeacher(post.course, req.user._id);

  const uid = req.user._id.toString();
  const alreadyLiked = (post.likes || []).some((id) => id.toString() === uid);

  if (alreadyLiked) {
    post.likes = (post.likes || []).filter((id) => id.toString() !== uid);
    post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
  } else {
    post.likes = [...(post.likes || []), req.user._id];
    post.likeCount = (post.likeCount || 0) + 1;
  }
  await post.save();

  res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
});

// ── Student: trending posts across enrolled courses
export const getTrendingPosts = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id, status: "active" }).select("course").lean();
  const courseIds = enrollments.map((e) => e.course);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await Discussion.find({
    course: { $in: courseIds },
    parentComment: null,
    isDeleted: false,
    createdAt: { $gte: since },
  })
    .sort({ likeCount: -1, replyCount: -1, views: -1 })
    .limit(10)
    .populate("author", "name avatar role")
    .populate("course", "title")
    .lean();

  const uid = req.user._id.toString();
  const result = posts.map((p) => ({
    ...p,
    likedByMe: (p.likes || []).some((id) => id.toString() === uid),
    likeCount: (p.likes || []).length,
  }));

  res.json({ success: true, posts: result });
});

// ── Student + Teacher: get announcements for a course
export const getCourseAnnouncements = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await isEnrolledOrTeacher(courseId, req.user._id);

  const announcements = await Announcement.find({ course: courseId })
    .sort({ isImportant: -1, createdAt: -1 })
    .limit(50)
    .populate("teacher", "name avatar")
    .lean();

  res.json({ success: true, announcements });
});

// ── Teacher: create announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, content, isImportant = false } = req.body;
  if (!title?.trim() || !content?.trim()) throw new ApiError(400, "Title and content are required");

  const course = await isTeacherOfCourse(courseId, req.user._id);

  const ann = await Announcement.create({
    course: courseId,
    teacher: req.user._id,
    title: title.trim(),
    content: content.trim(),
    isImportant,
  });

  // Emit to community room
  const io = getIo();
  if (io) io.to(`community:${courseId}`).emit("announcement-created", { announcement: ann.toObject() });

  // Notify all enrolled students
  const enrollments = await Enrollment.find({ course: courseId, status: "active" }).select("user").lean();
  const studentIds = enrollments.map((e) => e.user);
  if (studentIds.length > 0) {
    emitToUsers(studentIds.map(String), "announcement-created", {
      courseId, courseTitle: course.title, announcementTitle: title,
    });
    Notification.create({
      title: `📢 ${course.title}: ${title}`,
      message: content.trim().slice(0, 200),
      type: "announcement",
      targetAudience: "specific",
      targetUsers: studentIds,
      sentBy: req.user._id,
      isActive: true,
    }).catch(() => {});
  }

  const populated = await ann.populate("teacher", "name avatar");
  res.status(201).json({ success: true, announcement: populated });
});

// ── Teacher: delete announcement
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) throw new ApiError(404, "Announcement not found");
  await isTeacherOfCourse(ann.course, req.user._id);
  await ann.deleteOne();
  res.json({ success: true });
});

// ── Teacher: lock / unlock discussion thread
export const lockDiscussion = asyncHandler(async (req, res) => {
  const post = await Discussion.findById(req.params.id);
  if (!post) throw new ApiError(404, "Discussion not found");
  await isTeacherOfCourse(post.course, req.user._id);
  post.isLocked = !post.isLocked;
  await post.save();
  res.json({ success: true, isLocked: post.isLocked });
});

// ── Teacher: pending (unanswered) questions for a course
export const getPendingQuestions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await isTeacherOfCourse(courseId, req.user._id);

  const questions = await Discussion.find({
    course: courseId, isQuestion: true, isResolved: false, isDeleted: false, parentComment: null,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("author", "name avatar")
    .lean();

  res.json({ success: true, questions });
});

// ── Teacher: mark a Q&A post resolved
export const resolveQuestion = asyncHandler(async (req, res) => {
  const post = await Discussion.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found");
  await isTeacherOfCourse(post.course, req.user._id);
  post.isResolved = true;
  await post.save();
  res.json({ success: true });
});

// ── Student: AI summarize a discussion thread
export const summarizePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Discussion.findById(postId).populate("author", "name").lean();
  if (!post || post.isDeleted) throw new ApiError(404, "Post not found");
  await isEnrolledOrTeacher(post.course, req.user._id);
  if (!process.env.GEMINI_API_KEY) throw new ApiError(503, "AI not configured");

  const replies = await Discussion.find({ parentComment: postId, isDeleted: false })
    .populate("author", "name")
    .sort({ createdAt: 1 })
    .lean();

  const thread = [
    `Original post by ${post.author?.name || "Unknown"}: ${post.title ? post.title + "\n" : ""}${post.content}`,
    ...replies.map((r) => `Reply by ${r.author?.name || "Unknown"}: ${r.content}`),
  ].join("\n\n");

  if (thread.length < 80) throw new ApiError(400, "Thread too short to summarize");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(
    `Summarize this educational discussion thread in 2-3 concise sentences. Focus on the key question and main insights:\n\n${thread.slice(0, 3000)}`
  );
  const summary = result.response.text();
  res.json({ success: true, summary });
});

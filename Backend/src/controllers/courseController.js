import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeRole } from "../utils/roles.js";
import { emitToUsers } from "../services/socketService.js";

const buildSlug = (title = "") =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const teacherScope = (req) =>
  normalizeRole(req.user.role) === "teacher" ? { teacher: req.user._id } : {};

const getOwnedCourse = async (req) => {
  const course = await Course.findOne({ _id: req.params.courseId, ...teacherScope(req) });
  if (!course) throw new ApiError(404, "Course not found or not owned by this teacher");
  return course;
};

export const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ ...teacherScope(req) }).sort({ updatedAt: -1 });
  res.status(200).json({ success: true, courses });
});

export const createCourse = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  if (!title) throw new ApiError(400, "Course title is required");

  const allowedStatuses = ["draft", "published", "unpublished"];
  const status = allowedStatuses.includes(req.body.status) ? req.body.status : "draft";

  const course = await Course.create({
    teacher: req.user._id,
    title,
    slug: req.body.slug || buildSlug(title),
    description: req.body.description,
    category: req.body.category,
    tags: req.body.tags,
    thumbnail: req.body.thumbnail,
    pricing: req.body.pricing,
    status,
    duration: req.body.duration,
    estimatedHours: req.body.estimatedHours,
    skills: req.body.skills,
    objectives: req.body.objectives,
    weeklyPlan: req.body.weeklyPlan,
    capstone: req.body.capstone,
  });

  res.status(201).json({ success: true, course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  const allowed = [
    "title", "description", "category", "tags", "thumbnail", "pricing", "status",
    "duration", "estimatedHours", "skills", "objectives", "weeklyPlan", "capstone",
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });

  if (req.body.title && !req.body.slug) course.slug = buildSlug(req.body.title);
  if (req.body.slug) course.slug = req.body.slug;

  await course.save();
  res.status(200).json({ success: true, course });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  await course.deleteOne();
  res.status(200).json({ success: true, message: "Course deleted successfully" });
});

export const setCoursePublishState = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  course.status = req.body.published ? "published" : "unpublished";
  await course.save();
  res.status(200).json({ success: true, course });
});

export const createLesson = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  course.curriculum.lessons.push(req.body);
  await course.save();
  res.status(201).json({ success: true, course });
});

export const updateLesson = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  const lesson = course.curriculum.lessons.id(req.params.lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  Object.assign(lesson, req.body);
  await course.save();
  res.status(200).json({ success: true, course });
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  const lesson = course.curriculum.lessons.id(req.params.lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  lesson.deleteOne();
  await course.save();
  res.status(200).json({ success: true, course });
});

export const reorderLessons = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  const order = Array.isArray(req.body.order) ? req.body.order : [];

  course.curriculum.lessons.forEach((lesson) => {
    const index = order.indexOf(lesson._id.toString());
    if (index >= 0) lesson.order = index;
  });

  course.curriculum.lessons.sort((a, b) => a.order - b.order);
  await course.save();
  res.status(200).json({ success: true, course });
});

export const createQuiz = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  course.curriculum.quizzes.push(req.body);
  await course.save();
  res.status(201).json({ success: true, course });
});

export const createAssignment = asyncHandler(async (req, res) => {
  const course = await getOwnedCourse(req);
  course.curriculum.assignments.push(req.body);
  await course.save();
  res.status(201).json({ success: true, course });

  // Notify enrolled students (fire-and-forget)
  const assignment = req.body;
  Enrollment.find({ course: course._id, status: "active" }).select("student").lean()
    .then((enrollments) => {
      const studentIds = enrollments.map((e) => e.student);
      if (!studentIds.length) return;
      Notification.create({
        title: "New Assignment Posted",
        message: `A new assignment "${assignment.title}" has been posted in "${course.title}". ${assignment.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}.` : ""}`,
        type: "info",
        targetAudience: "specific",
        targetUsers: studentIds,
        sentBy: req.user._id,
        isActive: true,
      }).catch(() => {});
      emitToUsers(studentIds, "assignment-created", {
        courseId: course._id,
        courseTitle: course.title,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
      });
    })
    .catch(() => {});
});

export const getPublicCourses = asyncHandler(async (req, res) => {
  const { search, category, sort = "newest", page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { status: "published" };
  if (search) filter.title = { $regex: search, $options: "i" };
  if (category) filter.category = category;

  const sortMap = {
    newest: { createdAt: -1 },
    popular: { enrollmentCount: -1 },
    price_asc: { "pricing.price": 1 },
    price_desc: { "pricing.price": -1 },
  };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("teacher", "name avatar")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Course.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    courses,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

export const getPublicCategories = asyncHandler(async (req, res) => {
  const categories = await Course.distinct("category", { status: "published" });
  res.status(200).json({ success: true, categories: categories.filter(Boolean).sort() });
});

export const getPublicCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, status: "published" })
    .populate("teacher", "name avatar bio")
    .lean();

  if (!course) throw new ApiError(404, "Course not found");
  res.status(200).json({ success: true, course });
});

/**
 * GET /api/courses/:courseId
 * Unified course fetch:
 *  - Authenticated teacher  → own course in any status
 *  - Authenticated admin    → any course in any status
 *  - Unauthenticated / other roles → published courses only
 */
export const getCourseForTeacher = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.courseId,
    teacher: req.user._id,
  })
    .populate("teacher", "name avatar bio")
    .lean();

  if (!course) throw new ApiError(404, "Course not found or not owned by this teacher");
  res.status(200).json({ success: true, course });
});

export const getCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (req.user) {
    const role = normalizeRole(req.user.role);
    const scope =
      role === "teacher" ? { _id: courseId, teacher: req.user._id } : { _id: courseId };

    const course = await Course.findOne(scope)
      .populate("teacher", "name avatar bio")
      .lean();

    if (course) return res.status(200).json({ success: true, course });
  }

  const course = await Course.findOne({ _id: courseId, status: "published" })
    .populate("teacher", "name avatar bio")
    .lean();

  if (!course) throw new ApiError(404, "Course not found");
  res.status(200).json({ success: true, course });
});

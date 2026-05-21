import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import LiveClass from "../models/LiveClass.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";
import LessonCompletion from "../models/LessonCompletion.js";
import LessonProgress from "../models/LessonProgress.js";
import Submission from "../models/Submission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Bookmark from "../models/Bookmark.js";
import Certificate from "../models/Certificate.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendEnrollmentEmail, sendCompletionEmail, sendCertificateEmail, buildClientUrl } from "../services/emailService.js";
import { awardXP, getUserXP, getLevelFromXP, getNextLevelXP, BADGE_DEFS } from "../services/xpService.js";
import UserXP from "../models/UserXP.js";
import ActivityLog from "../models/ActivityLog.js";
import { generateAIAvatarUrl } from "../services/avatarService.js";
import { emitToUsers } from "../services/socketService.js";

const oid = (id) => new mongoose.Types.ObjectId(id);

// ─────────────────────── OVERVIEW ───────────────────────

export const getStudentOverview = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [
    enrollments,
    certCount,
    upcomingLive,
    recentCompletions,
    xpResult,
  ] = await Promise.all([
    Enrollment.find({ user: studentId })
      .populate("course", "title thumbnail curriculum.assignments slug")
      .lean(),
    Certificate.countDocuments({ student: studentId }),
    LiveClass.find({ status: { $in: ["scheduled", "live"] }, scheduledAt: { $gte: new Date() } })
      .populate("course", "title")
      .populate("teacher", "name")
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean(),
    LessonCompletion.find({ student: studentId })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate("course", "title")
      .lean(),
    QuizAttempt.aggregate([
      { $match: { student: studentId } },
      { $group: { _id: null, totalXP: { $sum: { $multiply: ["$percentage", 0.5] } } } },
    ]),
  ]);

  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.isCompleted).length;
  const avgProgress = totalEnrolled > 0
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / totalEnrolled)
    : 0;

  // Pending assignments
  let totalAssignments = 0;
  const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);
  enrollments.forEach((e) => {
    totalAssignments += e.course?.curriculum?.assignments?.length || 0;
  });
  const submittedCount = await Submission.countDocuments({ student: studentId, course: { $in: courseIds } });
  const pendingAssignments = Math.max(0, totalAssignments - submittedCount);

  // Learning streak
  const completionDates = await LessonCompletion.find({ student: studentId })
    .sort({ completedAt: -1 })
    .select("completedAt")
    .lean();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const uniqueDays = [...new Set(completionDates.map((c) => {
    const d = new Date(c.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a);
  let streak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    if (uniqueDays[i] >= today.getTime() - i * 86400000 - 86400000) streak++;
    else break;
  }

  // Weekly progress for chart
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
  const weeklyData = await LessonCompletion.aggregate([
    { $match: { student: studentId, completedAt: { $gte: eightWeeksAgo } } },
    { $group: { _id: { $week: "$completedAt" }, lessons: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // XP — use real persisted value when available, fall back to calculated
  const baseXP = enrollments.reduce((s, e) => s + Math.floor((e.progress || 0) * 10), 0);
  const quizXP = Math.floor(xpResult[0]?.totalXP || 0);
  const calculatedXP = baseXP + quizXP + certCount * 500;
  const userXPRecord = await UserXP.findOne({ user: studentId }).select("totalXP level").lean();
  const achievementPoints = userXPRecord?.totalXP > 0 ? userXPRecord.totalXP : calculatedXP;

  // Recent activity
  const recentActivity = recentCompletions.slice(0, 5).map((lc) => ({
    type: "lesson_complete",
    title: "Completed a lesson",
    meta: lc.course?.title || "Course",
    time: lc.completedAt,
  }));

  res.json({
    success: true,
    overview: {
      totalEnrolled,
      completedCourses,
      avgProgress,
      certificates: certCount,
      upcomingClasses: upcomingLive.length,
      pendingAssignments,
      learningStreak: streak,
      achievementPoints,
      weeklyProgress: weeklyData,
      recentActivity,
      upcomingLive: upcomingLive.slice(0, 3),
      recentCourses: enrollments
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 4)
        .map((e) => ({
          _id: e._id,
          course: e.course,
          progress: e.progress,
          isCompleted: e.isCompleted,
          status: e.status,
        })),
    },
  });
});

// ─────────────────────── COURSES ───────────────────────

export const getAllCourses = asyncHandler(async (req, res) => {
  const { search, category, sort = "latest", page = 1, limit = 12 } = req.query;
  const query = { status: "published" };
  if (search) query.title = { $regex: search, $options: "i" };
  if (category && category !== "All") query.category = category;

  const sortMap = {
    latest: { createdAt: -1 },
    popular: { enrollmentCount: -1 },
    price_asc: { "pricing.price": 1 },
    price_desc: { "pricing.price": -1 },
  };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [courses, total, enrollments] = await Promise.all([
    Course.find(query)
      .sort(sortMap[sort] || sortMap.latest)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("teacher", "name avatar")
      .select("title thumbnail description category teacher pricing enrollmentCount tags createdAt slug status")
      .lean(),
    Course.countDocuments(query),
    Enrollment.find({ user: req.user._id }).select("course").lean(),
  ]);

  const enrolledSet = new Set(enrollments.map((e) => e.course.toString()));
  const result = courses.map((c) => ({ ...c, isEnrolled: enrolledSet.has(c._id.toString()) }));

  res.json({ success: true, courses: result, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getCourseCategories = asyncHandler(async (req, res) => {
  const cats = await Course.distinct("category", { status: "published" });
  res.json({ success: true, categories: cats.filter(Boolean) });
});

export const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) throw new ApiError(404, "Course not found or not available");

  const existing = await Enrollment.findOne({ user: studentId, course: courseId });
  if (existing) throw new ApiError(409, "Already enrolled in this course");

  if ((course.pricing?.price ?? 0) > 0) {
    throw new ApiError(402, "This is a paid course. Please complete payment to enroll.");
  }

  const enrollment = await Enrollment.create({
    user: studentId,
    course: courseId,
    teacher: course.teacher,
    payment: { amount: 0, currency: course.pricing?.currency || "USD", method: "free", status: "completed" },
    status: "active",
  });

  await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

  // Fire-and-forget: email + in-app notification
  const populatedCourse = await Course.findById(courseId)
    .select("title teacher")
    .populate("teacher", "name")
    .lean();
  const student = await User.findById(studentId).select("name email").lean();
  if (student && populatedCourse) {
    sendEnrollmentEmail({
      to: student.email,
      studentName: student.name,
      courseTitle: populatedCourse.title,
      instructorName: populatedCourse.teacher?.name || "",
      dashboardUrl: buildClientUrl("/dashboard"),
    }).catch(() => {});
    Notification.create({
      title: "Enrollment Confirmed",
      message: `You're now enrolled in "${populatedCourse.title}". Start learning!`,
      type: "success",
      targetAudience: "specific",
      targetUsers: [studentId],
      sentBy: populatedCourse.teacher?._id || studentId,
      isActive: true,
    }).catch(() => {});
  }

  res.status(201).json({ success: true, message: "Enrolled successfully!", enrollment });
});

export const getEnrolledCourses = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 12 } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [enrollments, total] = await Promise.all([
    Enrollment.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("course", "title thumbnail description category curriculum teacher")
      .populate("teacher", "name avatar")
      .lean(),
    Enrollment.countDocuments(query),
  ]);

  res.json({ success: true, enrollments, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

// ─────────────────────── LESSONS ───────────────────────

export const getCourseLessons = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const course = await Course.findById(courseId).populate("teacher", "name avatar").lean();
  if (!course) throw new ApiError(404, "Course not found");

  const completions = await LessonCompletion.find({ student: req.user._id, course: courseId }).select("lessonId").lean();
  const completedSet = new Set(completions.map((c) => c.lessonId.toString()));

  const lessons = (course.curriculum?.lessons || []).map((l) => ({
    ...l,
    isCompleted: completedSet.has(l._id.toString()),
  }));

  res.json({
    success: true,
    course: { _id: course._id, title: course.title, thumbnail: course.thumbnail, teacher: course.teacher },
    lessons,
    progress: enrollment.progress,
    totalLessons: lessons.length,
    completedCount: completedSet.size,
  });
});

export const markLessonComplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  await LessonCompletion.findOneAndUpdate(
    { student: req.user._id, course: courseId, lessonId: oid(lessonId) },
    { completedAt: new Date() },
    { upsert: true, new: true }
  );

  const course = await Course.findById(courseId).select("curriculum.lessons").lean();
  const totalLessons = course?.curriculum?.lessons?.length || 1;
  const completedCount = await LessonCompletion.countDocuments({ student: req.user._id, course: courseId });
  const progress = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  enrollment.progress = progress;

  // ── Certificate at 80% (issued once, upsert prevents duplicates) ──────────
  let certIssuedNow = false;
  if (progress >= 80) {
    const existingCert = await Certificate.findOne({ student: req.user._id, course: courseId });
    if (!existingCert) {
      certIssuedNow = true;
      const certId = `CERT-${Date.now()}-${req.user._id.toString().slice(-6)}-${courseId.toString().slice(-4)}`;
      await Certificate.create({
        student: req.user._id,
        course: courseId,
        enrollment: enrollment._id,
        certificateId: certId,
        issuedAt: new Date(),
      });
      // Fire-and-forget: certificate emails + notifications
      (async () => {
        try {
          const [fullCourse, student] = await Promise.all([
            Course.findById(courseId).select("title teacher").populate("teacher", "name").lean(),
            User.findById(req.user._id).select("name email").lean(),
          ]);
          if (!fullCourse || !student) return;
          const teacherId = fullCourse.teacher?._id || req.user._id;
          await Promise.allSettled([
            sendCertificateEmail({
              to: student.email,
              studentName: student.name,
              courseTitle: fullCourse.title,
              certificateId: certId,
              downloadUrl: buildClientUrl("/dashboard"),
              verifyUrl: buildClientUrl("/dashboard"),
            }),
            Notification.create({
              title: "📜 Certificate Issued!",
              message: `Your certificate for "${fullCourse.title}" is ready. ID: ${certId}`,
              type: "success",
              targetAudience: "specific",
              targetUsers: [req.user._id],
              sentBy: teacherId,
              isActive: true,
            }),
          ]);
        } catch (_) {}
      })();
    }
  }

  // ── Course completion at 100% ─────────────────────────────────────────────
  if (progress === 100 && !enrollment.isCompleted) {
    enrollment.isCompleted = true;
    enrollment.completedAt = new Date();
    enrollment.status = "completed";
    // Fire-and-forget: completion email + notification
    (async () => {
      try {
        const [fullCourse, student] = await Promise.all([
          Course.findById(courseId).select("title teacher").populate("teacher", "name").lean(),
          User.findById(req.user._id).select("name email").lean(),
        ]);
        if (!fullCourse || !student) return;
        const teacherId = fullCourse.teacher?._id || req.user._id;
        await Promise.allSettled([
          sendCompletionEmail({
            to: student.email,
            studentName: student.name,
            courseTitle: fullCourse.title,
            instructorName: fullCourse.teacher?.name || "",
            dashboardUrl: buildClientUrl("/dashboard"),
          }),
          Notification.create({
            title: "🎉 Course Completed!",
            message: `Congratulations! You completed "${fullCourse.title}".`,
            type: "success",
            targetAudience: "specific",
            targetUsers: [req.user._id],
            sentBy: teacherId,
            isActive: true,
          }),
        ]);
      } catch (_) {}
    })();
  }

  await enrollment.save();

  // ── XP + activity (fire-and-forget) ──────────────────────────────────────
  awardXP(req.user._id, 10, `lesson:${lessonId}:${courseId}`, "lesson").catch(() => {});
  ActivityLog.create({ user: req.user._id, type: "lesson_complete", description: "Completed a lesson", metadata: { lessonId, courseId } }).catch(() => {});
  if (progress === 100) {
    awardXP(req.user._id, 100, `course:${courseId}`, "course").catch(() => {});
    ActivityLog.create({ user: req.user._id, type: "course_complete", description: "Completed a course", metadata: { courseId } }).catch(() => {});
  } else if (certIssuedNow) {
    awardXP(req.user._id, 100, `course:${courseId}`, "course").catch(() => {});
    ActivityLog.create({ user: req.user._id, type: "certificate", description: "Earned a certificate", metadata: { courseId } }).catch(() => {});
  }

  res.json({ success: true, progress, completedCount, totalLessons });
});

// ─────────────────────── CERTIFICATES ───────────────────────

export const getMyCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ student: req.user._id })
    .populate("course", "title thumbnail teacher category")
    .populate({ path: "course", populate: { path: "teacher", select: "name" } })
    .sort({ issuedAt: -1 })
    .lean();
  res.json({ success: true, certificates: certs });
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certId })
    .populate("student", "name avatar")
    .populate("course", "title thumbnail teacher")
    .lean();
  if (!cert) throw new ApiError(404, "Certificate not found");
  res.json({ success: true, certificate: cert });
});

// ─────────────────────── LEARNING PROGRESS ───────────────────────

export const getLearningProgress = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [enrollments, weeklyLessons, quizStats, recentCompletions] = await Promise.all([
    Enrollment.find({ user: studentId }).populate("course", "title curriculum.lessons").lean(),
    LessonCompletion.aggregate([
      { $match: { student: studentId, completedAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { year: { $year: "$completedAt" }, week: { $week: "$completedAt" }, dow: { $dayOfWeek: "$completedAt" } },
          date: { $first: "$completedAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { date: 1 } },
    ]),
    QuizAttempt.aggregate([
      { $match: { student: studentId } },
      { $group: { _id: null, attempts: { $sum: 1 }, avgScore: { $avg: "$percentage" }, passed: { $sum: { $cond: ["$passed", 1, 0] } } } },
    ]),
    LessonCompletion.find({ student: studentId }).sort({ completedAt: -1 }).limit(30).lean(),
  ]);

  // Daily activity for last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyActivity = days.map((d, idx) => {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - (6 - idx));
    dayDate.setHours(0, 0, 0, 0);
    const count = recentCompletions.filter((c) => {
      const cd = new Date(c.completedAt);
      cd.setHours(0, 0, 0, 0);
      return cd.getTime() === dayDate.getTime();
    }).length;
    return { day: d, lessons: count };
  });

  // Progress per course
  const courseProgress = enrollments.map((e) => ({
    title: e.course?.title || "Course",
    progress: e.progress || 0,
    isCompleted: e.isCompleted,
    totalLessons: e.course?.curriculum?.lessons?.length || 0,
  }));

  // Streak
  const uniqueDays = [...new Set(recentCompletions.map((c) => {
    const d = new Date(c.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a);
  const todayMs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  let streak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    if (uniqueDays[i] >= todayMs - i * 86400000 - 86400000) streak++;
    else break;
  }

  res.json({
    success: true,
    progress: {
      totalEnrolled: enrollments.length,
      completedCourses: enrollments.filter((e) => e.isCompleted).length,
      avgProgress: enrollments.length > 0 ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length) : 0,
      learningStreak: streak,
      totalLessonsCompleted: recentCompletions.length,
      quizAttempts: quizStats[0]?.attempts || 0,
      quizAvgScore: Math.round(quizStats[0]?.avgScore || 0),
      quizPassed: quizStats[0]?.passed || 0,
      dailyActivity,
      weeklyLessons: weeklyLessons.map((w) => ({ date: w.date, lessons: w.count })),
      courseProgress,
    },
  });
});

// ─────────────────────── LIVE CLASSES ───────────────────────

export const getUpcomingLiveClasses = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id }).select("course").lean();
  const courseIds = enrollments.map((e) => e.course);

  const [upcoming, past] = await Promise.all([
    LiveClass.find({ course: { $in: courseIds }, status: { $in: ["scheduled", "live"] } })
      .populate("course", "title thumbnail")
      .populate("teacher", "name avatar")
      .sort({ scheduledAt: 1 })
      .lean(),
    LiveClass.find({ course: { $in: courseIds }, status: "ended" })
      .populate("course", "title thumbnail")
      .populate("teacher", "name avatar")
      .sort({ scheduledAt: -1 })
      .limit(10)
      .lean(),
  ]);

  res.json({ success: true, upcoming, past });
});

// ─────────────────────── ASSIGNMENTS ───────────────────────

export const getMyAssignments = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const query = { user: req.user._id };
  if (courseId) query.course = courseId;

  const enrollments = await Enrollment.find(query)
    .populate("course", "title curriculum.assignments thumbnail")
    .lean();

  const assignments = [];
  for (const en of enrollments) {
    const courseAssignments = en.course?.curriculum?.assignments || [];
    for (const a of courseAssignments) {
      const submission = await Submission.findOne({
        student: req.user._id,
        course: en.course._id,
        assignmentId: a._id,
      }).lean();
      assignments.push({
        _id: a._id,
        title: a.title,
        instructions: a.instructions,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        course: { _id: en.course._id, title: en.course.title, thumbnail: en.course.thumbnail },
        submission: submission || null,
        isOverdue: a.dueDate && new Date(a.dueDate) < new Date() && !submission,
      });
    }
  }

  assignments.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    return 0;
  });

  res.json({ success: true, assignments });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const { courseId, assignmentId } = req.params;
  const { content, fileUrl } = req.body;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const course = await Course.findById(courseId).select("curriculum.assignments").lean();
  const assignment = course?.curriculum?.assignments?.find((a) => a._id.toString() === assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const submission = await Submission.findOneAndUpdate(
    { student: req.user._id, course: courseId, assignmentId: oid(assignmentId) },
    { content, fileUrl, assignmentTitle: assignment.title, maxScore: assignment.maxScore, status: "submitted", submittedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ success: true, submission });

  // Award XP + log activity (fire-and-forget)
  awardXP(req.user._id, 25, `assignment:${assignmentId}:${courseId}`, "assignment").catch(() => {});
  ActivityLog.create({ user: req.user._id, type: "assignment_submit", description: "Submitted an assignment", metadata: { assignmentId, courseId } }).catch(() => {});
});

// ─────────────────────── QUIZZES ───────────────────────

export const getQuizHistory = asyncHandler(async (req, res) => {
  const { courseId, page = 1, limit = 20 } = req.query;
  const query = { student: req.user._id };
  if (courseId) query.course = oid(courseId);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [attempts, total] = await Promise.all([
    QuizAttempt.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("course", "title thumbnail")
      .lean(),
    QuizAttempt.countDocuments(query),
  ]);

  const stats = await QuizAttempt.aggregate([
    { $match: { student: req.user._id } },
    { $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: "$percentage" }, passed: { $sum: { $cond: ["$passed", 1, 0] } }, best: { $max: "$percentage" } } },
  ]);

  res.json({ success: true, attempts, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }, stats: stats[0] || {} });
});

export const getAvailableQuizzes = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id, status: "active" })
    .select("course")
    .lean();
  const courseIds = enrollments.map((e) => e.course);

  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("title thumbnail curriculum.quizzes")
    .lean();

  const quizzes = [];
  for (const course of courses) {
    for (const quiz of (course.curriculum?.quizzes || [])) {
      quizzes.push({
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questionCount: quiz.questions?.length || 0,
        course: { _id: course._id, title: course.title, thumbnail: course.thumbnail },
      });
    }
  }

  res.json({ success: true, quizzes });
});

export const getCourseQuizzes = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const course = await Course.findById(courseId).select("title curriculum.quizzes").lean();
  if (!course) throw new ApiError(404, "Course not found");

  const quizzes = course.curriculum?.quizzes || [];
  res.json({ success: true, quizzes, courseTitle: course.title });
});

export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { courseId, quizId } = req.params;
  const { answers = [], timeTaken = 0 } = req.body;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const course = await Course.findById(courseId).select("curriculum.quizzes").lean();
  const quiz = course?.curriculum?.quizzes?.find((q) => q._id.toString() === quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  const questions = quiz.questions || [];
  let score = 0;
  const graded = answers.map((a, i) => {
    const q = questions[i];
    const correct = q && a.selected === q.answer;
    if (correct) score++;
    return { questionIndex: i, selected: a.selected, correct: !!correct };
  });

  const maxScore = questions.length || 1;
  const percentage = Math.round((score / maxScore) * 100);
  const passed = percentage >= 60;

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    course: courseId,
    quizId: oid(quizId),
    quizTitle: quiz.title,
    score,
    maxScore,
    percentage,
    passed,
    answers: graded,
    timeTaken,
  });

  res.json({ success: true, attempt, score, maxScore, percentage, passed });

  // Award XP + log activity (fire-and-forget, deduped per quiz per course)
  awardXP(req.user._id, 20, `quiz:${quizId}:${courseId}`, "quiz").catch(() => {});
  ActivityLog.create({ user: req.user._id, type: "quiz_attempt", description: `Completed a quiz (${percentage}%)`, metadata: { quizId, courseId, passed, percentage } }).catch(() => {});
});

// ─────────────────────── LEADERBOARD ───────────────────────

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { period } = req.query; // "weekly" | "monthly" | undefined (all-time)

  let leaderboard, myRank, myEntry;

  if (period === "weekly" || period === "monthly") {
    // Use UserXP eventLog to compute period-specific XP
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (period === "weekly" ? 7 : 30));

    const periodData = await UserXP.aggregate([
      {
        $project: {
          user: 1,
          periodXP: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$eventLog",
                    as: "e",
                    cond: { $gte: ["$$e.awardedAt", cutoff] },
                  },
                },
                as: "e",
                in: 10, // approximate: each event = 10 XP for ranking purposes
              },
            },
          },
        },
      },
      { $match: { periodXP: { $gt: 0 } } },
      { $sort: { periodXP: -1 } },
      { $limit: 50 },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "u" } },
      { $unwind: "$u" },
      {
        $project: {
          _id: "$user",
          name: "$u.name",
          avatar: "$u.avatar",
          xp: "$periodXP",
          coursesEnrolled: 0,
          completedCourses: 0,
        },
      },
    ]);

    leaderboard = periodData.map((s, i) => ({ ...s, rank: i + 1 }));
    myRank = leaderboard.findIndex((s) => s._id?.toString() === req.user._id.toString()) + 1;
    myEntry = leaderboard.find((s) => s._id?.toString() === req.user._id.toString());
  } else {
    // All-time: use Enrollment-based XP blended with UserXP
    const [enrollData, userXPMap] = await Promise.all([
      Enrollment.aggregate([
        { $match: { status: { $in: ["active", "completed"] } } },
        {
          $group: {
            _id: "$user",
            totalProgress: { $sum: "$progress" },
            coursesEnrolled: { $sum: 1 },
            completedCourses: { $sum: { $cond: ["$isCompleted", 1, 0] } },
            xp: { $sum: { $multiply: ["$progress", 10] } },
          },
        },
        { $sort: { xp: -1 } },
        { $limit: 50 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        {
          $project: {
            name: "$user.name",
            avatar: "$user.avatar",
            xp: 1,
            coursesEnrolled: 1,
            completedCourses: 1,
            totalProgress: 1,
          },
        },
      ]),
      UserXP.find({}).select("user totalXP level").lean().then((docs) =>
        new Map(docs.map((d) => [d.user.toString(), d]))
      ),
    ]);

    // Blend: use UserXP.totalXP when it exists and is higher
    const blended = enrollData.map((s) => {
      const xpRecord = userXPMap.get(s._id?.toString());
      const realXP = xpRecord?.totalXP || 0;
      return { ...s, xp: realXP > s.xp ? realXP : s.xp, level: xpRecord?.level };
    });

    blended.sort((a, b) => b.xp - a.xp);
    leaderboard = blended.map((s, i) => ({ ...s, rank: i + 1 }));
    myRank = leaderboard.findIndex((s) => s._id?.toString() === req.user._id.toString()) + 1;
    myEntry = leaderboard.find((s) => s._id?.toString() === req.user._id.toString());
  }

  res.json({
    success: true,
    leaderboard: leaderboard.slice(0, 20),
    myRank: myRank || leaderboard.length + 1,
    myEntry: myEntry || null,
    period: period || "all",
  });
});

export const getMyAchievements = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [enrollments, certs, quizStats, lessonsCompleted, userXP] = await Promise.all([
    Enrollment.find({ user: studentId }).lean(),
    Certificate.countDocuments({ student: studentId }),
    QuizAttempt.aggregate([
      { $match: { student: studentId } },
      { $group: { _id: null, total: { $sum: 1 }, passed: { $sum: { $cond: ["$passed", 1, 0] } }, avgScore: { $avg: "$percentage" } } },
    ]),
    LessonCompletion.countDocuments({ student: studentId }),
    getUserXP(studentId),
  ]);

  const completedCourses = enrollments.filter((e) => e.isCompleted).length;

  // Use real persisted XP when available, fall back to calculated
  const calculatedXP = enrollments.reduce((s, e) => s + Math.floor((e.progress || 0) * 10), 0) + certs * 500;
  const xp = userXP.totalXP > 0 ? userXP.totalXP : calculatedXP;

  // Build badge list: merge persisted badges + earned-by-count badges
  const unlockedKeys = new Set(userXP.unlockedBadges || []);

  // Retroactively check count-based badges for users who earned them before XP system
  if (lessonsCompleted >= 1)  unlockedKeys.add("first_lesson");
  if (lessonsCompleted >= 10) unlockedKeys.add("ten_lessons");
  if (lessonsCompleted >= 50) unlockedKeys.add("fifty_lessons");
  if (completedCourses >= 1)  unlockedKeys.add("first_course");
  if (completedCourses >= 3)  unlockedKeys.add("three_courses");
  if (certs >= 1)             unlockedKeys.add("first_cert");
  if (quizStats[0]?.passed >= 5) unlockedKeys.add("quiz_master");
  if (xp >= 1000)             unlockedKeys.add("xp_1000");

  const badges = BADGE_DEFS
    .filter((b) => unlockedKeys.has(b.key))
    .map((b) => ({ id: b.key, label: b.label, icon: b.icon, desc: b.desc }));

  res.json({
    success: true,
    achievements: {
      xp,
      level: userXP.level || getLevelFromXP(xp),
      streak: userXP.streak || 0,
      badges,
      completedCourses,
      certificates: certs,
      lessonsCompleted,
      quizAttempts: quizStats[0]?.total || 0,
      quizPassed: quizStats[0]?.passed || 0,
    },
  });
});

// ── Get XP profile (for profile page) ────────────────────────────────────────
export const getXpProfile = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [userXP, enrollments, certs] = await Promise.all([
    getUserXP(studentId),
    Enrollment.find({ user: studentId }).lean(),
    Certificate.countDocuments({ student: studentId }),
  ]);

  const calculatedXP = enrollments.reduce((s, e) => s + Math.floor((e.progress || 0) * 10), 0) + certs * 500;
  const totalXP = userXP.totalXP > 0 ? userXP.totalXP : calculatedXP;
  const level = userXP.level || getLevelFromXP(totalXP);
  const nextLevelXP = getNextLevelXP(level);
  const currentLevelXP = getNextLevelXP(level - 1) || 0;
  const progressInLevel = Math.max(0, totalXP - currentLevelXP);
  const xpNeeded = Math.max(1, nextLevelXP - currentLevelXP);
  const levelProgress = Math.min(100, Math.round((progressInLevel / xpNeeded) * 100));

  const unlockedKeys = new Set(userXP.unlockedBadges || []);
  const badges = BADGE_DEFS
    .filter((b) => unlockedKeys.has(b.key))
    .map((b) => ({ key: b.key, label: b.label, icon: b.icon, desc: b.desc }));

  res.json({
    success: true,
    xpProfile: {
      totalXP,
      level,
      nextLevelXP,
      levelProgress,
      streak: userXP.streak || 0,
      badges,
    },
  });
});

// ─────────────────────── NOTIFICATIONS ───────────────────────

export const getStudentNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {
    isActive: true,
    $or: [
      { targetAudience: "all" },
      { targetAudience: "students" },
      { targetAudience: "specific", targetUsers: req.user._id },
    ],
  };

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sentBy", "name avatar")
      .lean(),
    Notification.countDocuments(query),
  ]);

  const result = notifications.map((n) => ({
    ...n,
    isRead: (n.readBy || []).some((id) => id.toString() === req.user._id.toString()),
  }));

  if (unreadOnly === "true") {
    const unread = result.filter((n) => !n.isRead);
    return res.json({ success: true, notifications: unread, total: unread.length, pages: 1 });
  }

  const unreadCount = result.filter((n) => !n.isRead).length;
  res.json({ success: true, notifications: result, total, pages: Math.ceil(total / parseInt(limit)), unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Notification.findByIdAndUpdate(id, { $addToSet: { readBy: req.user._id } });
  res.json({ success: true });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const notifs = await Notification.find({
    isActive: true,
    $or: [{ targetAudience: "all" }, { targetAudience: "students" }, { targetAudience: "specific", targetUsers: req.user._id }],
  }).select("_id");
  await Notification.updateMany({ _id: { $in: notifs.map((n) => n._id) } }, { $addToSet: { readBy: req.user._id } });
  res.json({ success: true });
});

// ─────────────────────── BOOKMARKS ───────────────────────

export const getBookmarks = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = { student: req.user._id };
  if (search) query.lessonTitle = { $regex: search, $options: "i" };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [bookmarks, total] = await Promise.all([
    Bookmark.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Bookmark.countDocuments(query),
  ]);
  res.json({ success: true, bookmarks, pagination: { total, pages: Math.ceil(total / parseInt(limit)) } });
});

export const addBookmark = asyncHandler(async (req, res) => {
  const { courseId, lessonId, lessonTitle, courseTitle, note } = req.body;
  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const bookmark = await Bookmark.findOneAndUpdate(
    { student: req.user._id, course: courseId, lessonId: oid(lessonId) },
    { lessonTitle, courseTitle, note: note || "" },
    { upsert: true, new: true }
  );
  res.json({ success: true, bookmark });
});

export const removeBookmark = asyncHandler(async (req, res) => {
  await Bookmark.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  res.json({ success: true });
});

// ─────────────────────── DOWNLOADS ───────────────────────

export const getDownloads = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id })
    .populate("course", "title thumbnail curriculum.lessons")
    .lean();

  const downloads = [];
  for (const en of enrollments) {
    const lessons = en.course?.curriculum?.lessons || [];
    for (const lesson of lessons) {
      for (const resource of lesson.resources || []) {
        if (resource.type === "pdf" || resource.type === "download") {
          downloads.push({
            _id: resource._id,
            title: resource.title,
            type: resource.type,
            url: resource.url,
            lessonTitle: lesson.title,
            courseTitle: en.course.title,
            courseThumbnail: en.course.thumbnail,
            courseId: en.course._id,
          });
        }
      }
    }
  }

  // Also include course certificates
  const certs = await Certificate.find({ student: req.user._id })
    .populate("course", "title thumbnail")
    .lean();

  const certDownloads = certs.map((c) => ({
    _id: c._id,
    title: `Certificate - ${c.course?.title || "Course"}`,
    type: "certificate",
    certificateId: c.certificateId,
    courseTitle: c.course?.title,
    courseThumbnail: c.course?.thumbnail,
    issuedAt: c.issuedAt,
  }));

  res.json({ success: true, resources: downloads, certificates: certDownloads });
});

// ─────────────────────── PROFILE ───────────────────────

export const getStudentProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -__v").lean();
  const [enrollments, certs] = await Promise.all([
    Enrollment.countDocuments({ user: req.user._id }),
    Certificate.countDocuments({ student: req.user._id }),
  ]);
  res.json({ success: true, user: { ...user, enrollmentCount: enrollments, certCount: certs } });
});

export const updateStudentProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar, socialLinks, skills, interests, learningGoals, portfolio, preferredLanguage } = req.body;
  const update = { profileLastUpdated: new Date() };
  if (name) update.name = name;
  if (bio !== undefined) update.bio = bio;
  if (avatar !== undefined) update.avatar = avatar;
  if (socialLinks) update.socialLinks = socialLinks;
  if (Array.isArray(skills)) update.skills = skills.slice(0, 20);
  if (Array.isArray(interests)) update.interests = interests.slice(0, 20);
  if (Array.isArray(learningGoals)) update.learningGoals = learningGoals.slice(0, 10);
  if (portfolio !== undefined) update.portfolio = portfolio;
  if (preferredLanguage && ["en", "hi", "es", "fr"].includes(preferredLanguage)) update.preferredLanguage = preferredLanguage;

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true })
    .select("-password -refreshToken");

  ActivityLog.create({ user: req.user._id, type: "profile_update", description: "Updated profile information", metadata: {} }).catch(() => {});
  emitToUsers([req.user._id.toString()], "profile-updated", { userId: req.user._id });

  res.json({ success: true, user });
});

export const generateAIAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select("name skills interests learningGoals").lean();
  const completedCourses = await Enrollment.countDocuments({ user: userId, isCompleted: true });

  const { avatarUrl, promptSummary } = await generateAIAvatarUrl({
    name: user.name,
    skills: user.skills || [],
    interests: user.interests || [],
    learningGoals: user.learningGoals || [],
    completedCourses,
  });

  await User.findByIdAndUpdate(userId, { avatar: avatarUrl, aiAvatarPrompt: promptSummary, profileLastUpdated: new Date() });
  ActivityLog.create({ user: userId, type: "avatar_generate", description: "Generated AI avatar", metadata: { promptSummary } }).catch(() => {});
  emitToUsers([userId.toString()], "avatar-generated", { avatarUrl });

  res.json({ success: true, avatarUrl, promptSummary });
});

export const getStudentActivity = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const logs = await ActivityLog.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  res.json({ success: true, activity: logs });
});

export const changeStudentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, "Both passwords required");
  if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, "Current password is incorrect");

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password changed successfully" });
});

// ─────────────────────── LESSON VIDEO PROGRESS ───────────────────────

export const saveLessonProgress = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { lastPosition = 0, watchedDuration = 0, duration = 0, completed = false } = req.body;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const progress = await LessonProgress.findOneAndUpdate(
    { user: req.user._id, course: oid(courseId), lessonId: oid(lessonId) },
    { lastPosition, watchedDuration, duration, completed },
    { upsert: true, new: true }
  );

  // Mirror to LessonCompletion if newly completed
  if (completed) {
    const alreadyDone = await LessonCompletion.findOne({ student: req.user._id, course: courseId, lessonId: oid(lessonId) });
    if (!alreadyDone) {
      await LessonCompletion.create({ student: req.user._id, course: courseId, lessonId: oid(lessonId) });

      // Recalculate enrollment progress
      const course = await Course.findById(courseId).select("curriculum.lessons").lean();
      const totalLessons = course?.curriculum?.lessons?.length || 0;
      if (totalLessons > 0) {
        const completedCount = await LessonCompletion.countDocuments({ student: req.user._id, course: courseId });
        const newProgress = Math.round((completedCount / totalLessons) * 100);
        const isCompleted = completedCount >= totalLessons;
        await Enrollment.findOneAndUpdate(
          { user: req.user._id, course: courseId },
          { progress: newProgress, isCompleted, ...(isCompleted ? { completedAt: new Date() } : {}) }
        );
      }
    }
  }

  res.json({ success: true, progress });
});

export const getLessonProgress = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (!enrollment) throw new ApiError(403, "Not enrolled in this course");

  const progress = await LessonProgress.findOne({
    user: req.user._id,
    course: oid(courseId),
    lessonId: oid(lessonId),
  }).lean();

  res.json({ success: true, progress: progress || null });
});

// ─────────────────────── LIVE CLASS ATTENDANCE ───────────────────────

export const joinLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cls = await LiveClass.findById(id).lean();
  if (!cls) throw new ApiError(404, "Live class not found");
  if (cls.status === "cancelled") throw new ApiError(400, "This class has been cancelled");
  if (cls.status === "ended") throw new ApiError(400, "This class has already ended");

  if (cls.course) {
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: cls.course });
    if (!enrollment) throw new ApiError(403, "Not enrolled in this course");
  }

  await Attendance.findOneAndUpdate(
    { session: cls._id, student: req.user._id },
    {
      teacher: cls.teacher,
      course: cls.course || null,
      status: "present",
      markedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  const count = await Attendance.countDocuments({ session: cls._id, status: "present" });
  await LiveClass.findByIdAndUpdate(cls._id, { attendanceCount: count });

  res.json({ success: true, meetingLink: cls.meetingLink });

  // Award XP + log activity (fire-and-forget, deduped per session)
  awardXP(req.user._id, 15, `live:${cls._id}`, "live").catch(() => {});
  ActivityLog.create({ user: req.user._id, type: "live_class", description: "Attended a live class", metadata: { liveClassId: cls._id.toString() } }).catch(() => {});
});

export const leaveLiveClass = asyncHandler(async (req, res) => {
  // Intentionally lightweight — attendance is already marked on join.
  res.json({ success: true });
});

export const getAttendanceHistory = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ student: req.user._id })
    .populate({
      path: "session",
      select: "title scheduledAt durationMinutes status recordingUrl meetingLink",
    })
    .populate("course", "title thumbnail")
    .sort({ markedAt: -1 })
    .lean();

  res.json({ success: true, records });
});

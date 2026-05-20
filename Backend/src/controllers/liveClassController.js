import LiveClass from "../models/LiveClass.js";
import Attendance from "../models/Attendance.js";
import MeetingRecording from "../models/MeetingRecording.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createMeetEvent,
  updateMeetEvent,
  cancelMeetEvent,
} from "../services/googleMeetService.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const ownedClass = async (req) => {
  const cls = await LiveClass.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!cls) throw new ApiError(404, "Live class not found");
  return cls;
};

const notifyEnrolledStudents = async ({ courseId, sentBy, title, message, type = "info" }) => {
  if (!courseId) return;
  try {
    const enrollments = await Enrollment.find({ course: courseId, status: "active" })
      .select("user")
      .lean();
    const studentIds = enrollments.map((e) => e.user);
    if (studentIds.length === 0) return;
    await Notification.create({
      title,
      message,
      type,
      targetAudience: "specific",
      targetUsers: studentIds,
      sentBy,
      isActive: true,
    });
  } catch (err) {
    console.error("[liveClass] notifyEnrolledStudents failed:", err.message);
  }
};

// ── Teacher: List ──────────────────────────────────────────────────────────────

export const getLiveClasses = asyncHandler(async (req, res) => {
  const { status, courseId, page = 1, limit = 20 } = req.query;
  const filter = { teacher: req.user._id };
  if (status) filter.status = status;
  if (courseId) filter.course = courseId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [classes, total] = await Promise.all([
    LiveClass.find(filter)
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("course", "title thumbnail"),
    LiveClass.countDocuments(filter),
  ]);

  res.json({
    success: true,
    classes,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ── Teacher: Get single ────────────────────────────────────────────────────────

export const getLiveClassById = asyncHandler(async (req, res) => {
  const cls = await LiveClass.findOne({ _id: req.params.id, teacher: req.user._id })
    .populate("course", "title thumbnail");
  if (!cls) throw new ApiError(404, "Live class not found");
  res.json({ success: true, liveClass: cls });
});

// ── Teacher: Create ────────────────────────────────────────────────────────────

export const createLiveClass = asyncHandler(async (req, res) => {
  const { title, description, scheduledAt, durationMinutes, meetingLink, courseId, lessonId } = req.body;
  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!scheduledAt) throw new ApiError(400, "Scheduled time is required");

  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + (durationMinutes || 60) * 60_000);

  // Auto-generate Google Meet link unless teacher provided one
  let resolvedMeetingLink = meetingLink?.trim() || "";
  let googleEventId = "";

  if (!resolvedMeetingLink) {
    const meet = await createMeetEvent({
      title: title.trim(),
      description: description?.trim() || "",
      startTime,
      endTime,
    });
    resolvedMeetingLink = meet.meetingLink;
    googleEventId = meet.googleEventId;
  }

  const cls = await LiveClass.create({
    teacher: req.user._id,
    course: courseId || null,
    lessonId: lessonId || null,
    title: title.trim(),
    description: description?.trim() || "",
    scheduledAt: startTime,
    durationMinutes: durationMinutes || 60,
    meetingLink: resolvedMeetingLink,
    googleEventId,
  });

  // Notify enrolled students
  if (courseId) {
    await notifyEnrolledStudents({
      courseId,
      sentBy: req.user._id,
      title: "New Live Class Scheduled",
      message: `"${cls.title}" has been scheduled on ${startTime.toLocaleString()}. ${resolvedMeetingLink ? "Click to join when it starts." : "Meeting link will be shared soon."}`,
      type: "info",
    });
  }

  res.status(201).json({ success: true, liveClass: cls });
});

// ── Teacher: Update ────────────────────────────────────────────────────────────

export const updateLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);

  const allowed = ["title", "description", "scheduledAt", "durationMinutes", "meetingLink", "meetingId", "recordingUrl", "lessonId"];
  const changed = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) {
      cls[f] = req.body[f];
      changed[f] = req.body[f];
    }
  });

  // Update Google Calendar event if time or title changed
  if (cls.googleEventId && (changed.scheduledAt || changed.durationMinutes || changed.title)) {
    const startTime = new Date(cls.scheduledAt);
    const endTime = new Date(startTime.getTime() + cls.durationMinutes * 60_000);
    await updateMeetEvent(cls.googleEventId, {
      title: cls.title,
      description: cls.description,
      startTime,
      endTime,
    });
  }

  await cls.save();
  res.json({ success: true, liveClass: cls });
});

// ── Teacher: Cancel ────────────────────────────────────────────────────────────

export const cancelLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  if (cls.status === "cancelled") throw new ApiError(400, "Class is already cancelled");
  if (cls.status === "ended") throw new ApiError(400, "Cannot cancel an ended class");

  cls.status = "cancelled";
  cls.cancelledAt = new Date();
  await cls.save();

  await cancelMeetEvent(cls.googleEventId);

  if (cls.course) {
    await notifyEnrolledStudents({
      courseId: cls.course,
      sentBy: req.user._id,
      title: "Live Class Cancelled",
      message: `The live class "${cls.title}" scheduled for ${new Date(cls.scheduledAt).toLocaleString()} has been cancelled.`,
      type: "alert",
    });
  }

  res.json({ success: true, liveClass: cls });
});

// ── Teacher: Delete ────────────────────────────────────────────────────────────

export const deleteLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  await cancelMeetEvent(cls.googleEventId);
  await cls.deleteOne();
  res.json({ success: true, message: "Live class deleted" });
});

// ── Teacher: Start / End ───────────────────────────────────────────────────────

export const startLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  cls.status = "live";
  cls.startedAt = new Date();
  await cls.save();

  if (cls.course) {
    await notifyEnrolledStudents({
      courseId: cls.course,
      sentBy: req.user._id,
      title: "Live Class Started",
      message: `"${cls.title}" is now live! Join now${cls.meetingLink ? `: ${cls.meetingLink}` : "."}`,
      type: "success",
    });
  }

  res.json({ success: true, liveClass: cls });
});

export const endLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  cls.status = "ended";
  cls.endedAt = new Date();
  if (req.body.recordingUrl) cls.recordingUrl = req.body.recordingUrl;
  await cls.save();
  res.json({ success: true, liveClass: cls });
});

// ── Teacher: Attendance ────────────────────────────────────────────────────────

export const getSessionAttendance = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  const records = await Attendance.find({ session: cls._id })
    .populate("student", "name avatar email")
    .sort({ markedAt: 1 });

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
  };

  res.json({ success: true, attendance: records, stats, session: cls });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  const { studentId, status, note } = req.body;
  if (!studentId) throw new ApiError(400, "Student ID is required");

  const record = await Attendance.findOneAndUpdate(
    { session: cls._id, student: studentId },
    { teacher: req.user._id, course: cls.course, status: status || "present", note: note || "", markedAt: new Date() },
    { upsert: true, new: true }
  );

  const count = await Attendance.countDocuments({ session: cls._id, status: "present" });
  cls.attendanceCount = count;
  await cls.save();

  res.json({ success: true, record });
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const filter = { teacher: req.user._id };
  if (courseId) filter.course = courseId;

  const report = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$student",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: { path: "$student", preserveNullAndEmpty: true } },
    {
      $project: {
        studentId: "$_id",
        name: "$student.name",
        email: "$student.email",
        avatar: "$student.avatar",
        total: 1,
        present: 1,
        absent: 1,
        late: 1,
        percentage: { $multiply: [{ $divide: ["$present", { $max: ["$total", 1] }] }, 100] },
      },
    },
    { $sort: { percentage: -1 } },
  ]);

  res.json({ success: true, report });
});

// ── Teacher: Recordings ────────────────────────────────────────────────────────

export const attachRecording = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  const { url, title, platform, durationMinutes } = req.body;
  if (!url?.trim()) throw new ApiError(400, "Recording URL is required");

  const recording = await MeetingRecording.create({
    session: cls._id,
    addedBy: req.user._id,
    url: url.trim(),
    title: title?.trim() || cls.title,
    platform: platform || "other",
    durationMinutes: durationMinutes || 0,
  });

  // Also update quick-access recordingUrl on LiveClass
  if (!cls.recordingUrl) {
    cls.recordingUrl = url.trim();
    await cls.save();
  }

  res.status(201).json({ success: true, recording });
});

export const getRecordings = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  const recordings = await MeetingRecording.find({ session: cls._id }).sort({ createdAt: -1 });
  res.json({ success: true, recordings });
});

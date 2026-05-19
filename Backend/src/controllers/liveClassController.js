import LiveClass from "../models/LiveClass.js";
import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const ownedClass = async (req) => {
  const cls = await LiveClass.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!cls) throw new ApiError(404, "Live class not found");
  return cls;
};

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

  res.json({ success: true, classes, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

export const createLiveClass = asyncHandler(async (req, res) => {
  const { title, description, scheduledAt, durationMinutes, meetingLink, courseId } = req.body;
  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!scheduledAt) throw new ApiError(400, "Scheduled time is required");

  const cls = await LiveClass.create({
    teacher: req.user._id,
    course: courseId || null,
    title: title.trim(),
    description: description?.trim() || "",
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes || 60,
    meetingLink: meetingLink?.trim() || "",
  });

  res.status(201).json({ success: true, liveClass: cls });
});

export const updateLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  const allowed = ["title", "description", "scheduledAt", "durationMinutes", "meetingLink", "meetingId", "recordingUrl"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) cls[f] = req.body[f]; });
  await cls.save();
  res.json({ success: true, liveClass: cls });
});

export const deleteLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  await cls.deleteOne();
  res.json({ success: true, message: "Live class deleted" });
});

export const startLiveClass = asyncHandler(async (req, res) => {
  const cls = await ownedClass(req);
  cls.status = "live";
  cls.startedAt = new Date();
  await cls.save();
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

  // Update count on live class
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
    {
      $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" },
    },
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

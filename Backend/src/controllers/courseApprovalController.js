import Course from "../models/Course.js";
import AuditLog from "../models/AuditLog.js";

const logAction = async (action, req, resourceId, details = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: {
        userId: req.user?._id,
        name: req.user?.name || "",
        email: req.user?.email || "",
        role: req.user?.role || "admin",
      },
      resource: "course",
      resourceId,
      details,
      ipAddress: req.ip || "unknown",
      status: "success",
    });
  } catch (_) {}
};

export const getPendingCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "pending_review";

    const validStatuses = ["pending_review", "published", "rejected", "draft", "all"];
    const queryStatus = validStatuses.includes(status) ? status : "pending_review";

    const query = queryStatus === "all" ? {} : { status: queryStatus };

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("teacher", "name email avatar teacherId")
        .select("-curriculum.lessons.richText")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Course.countDocuments(query),
    ]);

    res.json({
      success: true,
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { note } = req.body;

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        status: "published",
        approvalNote: note || "Approved by admin",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("teacher", "name email");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    await logAction("COURSE_APPROVED", req, courseId, { title: course.title, teacher: course.teacher?.email });

    res.json({ success: true, message: "Course approved and published", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        status: "rejected",
        approvalNote: reason,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("teacher", "name email");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    await logAction("COURSE_REJECTED", req, courseId, { title: course.title, reason });

    res.json({ success: true, message: "Course rejected", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const featureCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    course.isFeatured = !course.isFeatured;
    await course.save();

    await logAction("COURSE_FEATURE_TOGGLED", req, courseId, {
      title: course.title,
      isFeatured: course.isFeatured,
    });

    res.json({
      success: true,
      message: `Course ${course.isFeatured ? "featured" : "unfeatured"} successfully`,
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestCourseChanges = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { changes } = req.body;

    if (!changes) {
      return res.status(400).json({ success: false, message: "Change request details are required" });
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        status: "draft",
        approvalNote: `Changes requested: ${changes}`,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("teacher", "name email");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    await logAction("COURSE_CHANGES_REQUESTED", req, courseId, { title: course.title, changes });

    res.json({ success: true, message: "Change request sent to teacher", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

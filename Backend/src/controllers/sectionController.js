import Course from "../models/Course.js";
import Section from "../models/Section.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const assertCourseOwnership = async (courseId, teacherId) => {
  const exists = await Course.exists({ _id: courseId, teacher: teacherId });
  if (!exists) throw new ApiError(404, "Course not found or not owned by this teacher");
};

export const getSections = asyncHandler(async (req, res) => {
  await assertCourseOwnership(req.params.courseId, req.user._id);
  const sections = await Section.find({ course: req.params.courseId }).sort({ order: 1 });
  res.status(200).json({ success: true, sections });
});

export const createSection = asyncHandler(async (req, res) => {
  await assertCourseOwnership(req.params.courseId, req.user._id);

  const { title, description, order, lessonIds, status } = req.body;
  if (!title?.trim()) throw new ApiError(400, "Section title is required");

  const section = await Section.create({
    title: title.trim(),
    description,
    course: req.params.courseId,
    order: order ?? 0,
    lessonIds: lessonIds ?? [],
    status: status ?? "active",
  });

  res.status(201).json({ success: true, section });
});

export const updateSection = asyncHandler(async (req, res) => {
  await assertCourseOwnership(req.params.courseId, req.user._id);

  const section = await Section.findOne({
    _id: req.params.sectionId,
    course: req.params.courseId,
  });
  if (!section) throw new ApiError(404, "Section not found");

  const allowed = ["title", "description", "order", "lessonIds", "status"];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) section[f] = req.body[f];
  });

  await section.save();
  res.status(200).json({ success: true, section });
});

export const deleteSection = asyncHandler(async (req, res) => {
  await assertCourseOwnership(req.params.courseId, req.user._id);

  const section = await Section.findOneAndDelete({
    _id: req.params.sectionId,
    course: req.params.courseId,
  });
  if (!section) throw new ApiError(404, "Section not found");

  res.status(200).json({ success: true, message: "Section deleted" });
});

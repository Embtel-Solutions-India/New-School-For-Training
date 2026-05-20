import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import asyncHandler from "../utils/asyncHandler.js";
import s3Client from "../config/s3.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import ApiError from "../utils/ApiError.js";

function extractKeyFromUrl(videoUrl) {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    // Works for both direct S3 URLs and CloudFront distributions:
    // pathname is /courses/abc/lessons/xyz/videos/file.mp4 → strip leading slash
    return url.pathname.replace(/^\//, "") || null;
  } catch {
    return null;
  }
}

export const getVideoSignedUrl = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;

  const course = await Course.findOne(
    { "curriculum.lessons._id": lessonId },
    { curriculum: 1, teacher: 1 }
  ).lean();
  if (!course) throw new ApiError(404, "Lesson not found");

  const lesson = course.curriculum?.lessons?.find(
    (l) => l._id.toString() === lessonId
  );
  if (!lesson) throw new ApiError(404, "Lesson not found");

  // Authorization
  const role = req.user.role;
  if (role === "student") {
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (!enrollment) throw new ApiError(403, "Not enrolled in this course");
  } else if (role === "teacher") {
    if (course.teacher.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access denied");
    }
  }
  // admin: unrestricted

  const key = lesson.videoKey || extractKeyFromUrl(lesson.videoUrl);
  if (!key) throw new ApiError(404, "Video not available for this lesson");

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  const videoUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  res.json({ success: true, videoUrl });
});

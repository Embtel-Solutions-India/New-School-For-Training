import { v4 as uuidv4 } from "uuid";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  abortMultipartUpload,
  createMultipartUpload,
  finishMultipartUpload,
  generatePartPresignedUrl,
} from "../services/s3Service.js";
import Upload from "../models/Upload.js";
import mongoose from "mongoose";

// Only video and large file types qualify for multipart
const MULTIPART_RULES = {
  "video/mp4":       { sub: "videos",  resourceType: "video" },
  "video/webm":      { sub: "videos",  resourceType: "video" },
  "video/quicktime": { sub: "videos",  resourceType: "video" },
  "video/x-msvideo": { sub: "videos",  resourceType: "video" },
  "application/pdf": { sub: "pdfs",    resourceType: "pdf" },
  "image/jpeg":      { sub: "images",  resourceType: "link" },
  "image/png":       { sub: "images",  resourceType: "link" },
  "image/webp":      { sub: "images",  resourceType: "link" },
};

export const initiateMultipart = asyncHandler(async (req, res) => {
  const { fileName, fileType, fileSize, courseId, lessonId } = req.body;

  if (!fileName || !fileType || !courseId) {
    throw new ApiError(400, "fileName, fileType, and courseId are required");
  }

  const rule = MULTIPART_RULES[fileType];
  if (!rule) throw new ApiError(400, `File type "${fileType}" is not supported for multipart upload`);

  const ext = fileName.split(".").pop().toLowerCase();
  const safeName = `${uuidv4()}.${ext}`;
  const lessonPath = lessonId ? `lessons/${lessonId}` : `lessons/tmp`;
  const fileKey = `courses/${courseId}/${lessonPath}/${rule.sub}/${safeName}`;

  const { uploadId, fileUrl } = await createMultipartUpload({ fileKey, fileType });

  res.json({ success: true, uploadId, fileKey, fileUrl, resourceType: rule.resourceType });
});

export const getPartUrl = asyncHandler(async (req, res) => {
  const { fileKey, uploadId, partNumber } = req.body;

  if (!fileKey || !uploadId || !partNumber) {
    throw new ApiError(400, "fileKey, uploadId, and partNumber are required");
  }

  const presignedUrl = await generatePartPresignedUrl({
    fileKey,
    uploadId,
    partNumber: Number(partNumber),
  });

  res.json({ success: true, presignedUrl });
});

export const completeMultipart = asyncHandler(async (req, res) => {
  const { fileKey, uploadId, fileName, fileType, fileSize, courseId, lessonId } = req.body;

  if (!fileKey || !uploadId) {
    throw new ApiError(400, "fileKey and uploadId are required");
  }

  await finishMultipartUpload({ fileKey, uploadId });

  // Save upload metadata
  try {
    const rule = MULTIPART_RULES[fileType] || {};
    const validCourseId = mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined;
    await Upload.create({
      fileName: fileName || fileKey.split("/").pop(),
      fileKey,
      fileUrl: req.body.fileUrl || "",
      fileSize: fileSize || 0,
      mimeType: fileType || "",
      resourceType: rule.resourceType || "",
      uploadedBy: req.user._id,
      courseId: validCourseId,
      lessonId: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : undefined,
    });
  } catch {
    // Non-fatal — upload already completed in S3
  }

  res.json({ success: true, message: "Multipart upload completed" });
});

export const abortMultipart = asyncHandler(async (req, res) => {
  const { fileKey, uploadId } = req.body;

  if (!fileKey || !uploadId) {
    throw new ApiError(400, "fileKey and uploadId are required");
  }

  await abortMultipartUpload({ fileKey, uploadId });
  res.json({ success: true, message: "Multipart upload aborted" });
});

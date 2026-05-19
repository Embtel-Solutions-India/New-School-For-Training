import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteS3Object, generatePresignedUploadUrl } from "../services/s3Service.js";
import { v4 as uuidv4 } from "uuid";
import Upload from "../models/Upload.js";

// File type rules: { maxSize in bytes, s3Subfolder, resourceType }
const FILE_RULES = {
  "video/mp4":         { maxSize: 5 * 1024 ** 3,  sub: "videos",        resourceType: "video"    },
  "video/webm":        { maxSize: 5 * 1024 ** 3,  sub: "videos",        resourceType: "video"    },
  "video/quicktime":   { maxSize: 5 * 1024 ** 3,  sub: "videos",        resourceType: "video"    },
  "video/x-msvideo":   { maxSize: 5 * 1024 ** 3,  sub: "videos",        resourceType: "video"    },
  "application/pdf":   { maxSize: 50  * 1024 ** 2, sub: "pdfs",          resourceType: "pdf"      },
  "application/msword":{ maxSize: 50  * 1024 ** 2, sub: "docs",          resourceType: "download" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                       { maxSize: 50  * 1024 ** 2, sub: "docs",          resourceType: "download" },
  "application/vnd.ms-powerpoint":
                       { maxSize: 100 * 1024 ** 2, sub: "presentations", resourceType: "download" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                       { maxSize: 100 * 1024 ** 2, sub: "presentations", resourceType: "download" },
  "application/zip":   { maxSize: 500 * 1024 ** 2, sub: "resources",     resourceType: "download" },
  "application/x-zip-compressed":
                       { maxSize: 500 * 1024 ** 2, sub: "resources",     resourceType: "download" },
  "image/jpeg":        { maxSize: 10  * 1024 ** 2, sub: "images",        resourceType: "link"     },
  "image/png":         { maxSize: 10  * 1024 ** 2, sub: "images",        resourceType: "link"     },
  "image/webp":        { maxSize: 10  * 1024 ** 2, sub: "images",        resourceType: "link"     },
  "image/gif":         { maxSize: 10  * 1024 ** 2, sub: "images",        resourceType: "link"     },
};

export const getPresignedUrl = asyncHandler(async (req, res) => {
  const { fileName, fileType, fileSize, courseId, lessonId } = req.body;

  if (!fileName || !fileType || !courseId) {
    throw new ApiError(400, "fileName, fileType, and courseId are required");
  }

  const rule = FILE_RULES[fileType];
  if (!rule) throw new ApiError(400, `File type "${fileType}" is not supported`);

  if (fileSize && fileSize > rule.maxSize) {
    const mb = (rule.maxSize / 1024 ** 2).toFixed(0);
    throw new ApiError(400, `File exceeds the ${mb} MB size limit for this type`);
  }

  const ext = fileName.split(".").pop().toLowerCase();
  const uniqueId = uuidv4();
  const safeName = `${uniqueId}.${ext}`;
  const lessonPath = lessonId ? `lessons/${lessonId}` : `lessons/tmp`;
  const s3Key = `courses/${courseId}/${lessonPath}/${rule.sub}/${safeName}`;

  const { presignedUrl, fileKey, fileUrl } = await generatePresignedUploadUrl({
    fileName,
    fileType,
    s3Key,
  });

  // Persist upload metadata (non-fatal if this fails)
  try {
    const validCourseId = mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined;
    await Upload.create({
      fileName,
      fileKey,
      fileUrl,
      fileSize: fileSize || 0,
      mimeType: fileType,
      resourceType: rule.resourceType,
      uploadedBy: req.user._id,
      courseId: validCourseId,
      lessonId: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : undefined,
    });
  } catch {
    // Non-fatal — presigned URL already generated
  }

  res.json({
    success: true,
    presignedUrl,
    fileKey,
    fileUrl,
    resourceType: rule.resourceType,
  });
});

export const deleteUpload = asyncHandler(async (req, res) => {
  const { fileKey } = req.body;
  if (!fileKey) throw new ApiError(400, "fileKey is required");

  await deleteS3Object(fileKey);
  res.json({ success: true, message: "File deleted from S3" });
});

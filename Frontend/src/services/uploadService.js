import axios from "axios";
import API from "./api";

export const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50 MB — files above this use multipart
const PART_SIZE = 10 * 1024 * 1024;                  // 10 MB per part

/**
 * Step 1 — Ask the backend for a pre-signed S3 PUT URL.
 * Returns: { presignedUrl, fileKey, fileUrl, resourceType }
 */
export const requestPresignedUrl = async ({ fileName, fileType, fileSize, courseId, lessonId }) => {
  const { data } = await API.post("/upload/presigned-url", {
    fileName,
    fileType,
    fileSize,
    courseId,
    lessonId: lessonId || undefined,
  });
  return data;
};

/**
 * Step 2 — PUT the file directly to S3 using the pre-signed URL.
 * Uses a plain axios instance (NOT the authenticated one) so JWT
 * headers don't invalidate the S3 request signature.
 */
export const uploadToS3 = async ({ presignedUrl, file, onProgress, signal }) => {
  await axios.put(presignedUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    },
    signal,
  });
};

/**
 * Ask the backend to delete a previously-uploaded S3 object.
 */
export const deleteUploadedFile = async (fileKey) => {
  await API.post("/upload/delete", { fileKey });
};

// ── Multipart upload ──────────────────────────────────────────────────────────

const initiateMultipart = async ({ fileName, fileType, fileSize, courseId, lessonId }) => {
  const { data } = await API.post("/upload/multipart/initiate", {
    fileName, fileType, fileSize, courseId, lessonId: lessonId || undefined,
  });
  return data; // { uploadId, fileKey, fileUrl, resourceType }
};

const getPartPresignedUrl = async ({ fileKey, uploadId, partNumber }) => {
  const { data } = await API.post("/upload/multipart/part-url", { fileKey, uploadId, partNumber });
  return data.presignedUrl;
};

const completeMultipartRequest = async ({ fileKey, uploadId, fileName, fileType, fileSize, courseId, lessonId, fileUrl }) => {
  await API.post("/upload/multipart/complete", {
    fileKey, uploadId, fileName, fileType, fileSize, courseId,
    lessonId: lessonId || undefined,
    fileUrl,
  });
};

const abortMultipartRequest = async ({ fileKey, uploadId }) => {
  await API.post("/upload/multipart/abort", { fileKey, uploadId }).catch(() => {});
};

/**
 * Upload a large file directly to S3 using the multipart upload API.
 * Parts are uploaded sequentially with per-part progress reporting.
 * The backend uses ListParts to gather ETags, avoiding CORS ETag header issues.
 */
export const uploadToS3Multipart = async ({
  file, courseId, lessonId, onProgress, signal,
}) => {
  const { uploadId, fileKey, fileUrl, resourceType } = await initiateMultipart({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    courseId,
    lessonId,
  });

  const totalParts = Math.ceil(file.size / PART_SIZE);
  let uploadedBytes = 0;

  try {
    for (let i = 0; i < totalParts; i++) {
      if (signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");

      const start = i * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const chunk = file.slice(start, end);

      const presignedUrl = await getPartPresignedUrl({
        fileKey, uploadId, partNumber: i + 1,
      });

      await axios.put(presignedUrl, chunk, {
        headers: { "Content-Type": file.type },
        signal,
        onUploadProgress: (event) => {
          if (event.loaded) {
            onProgress?.(
              Math.round(((uploadedBytes + event.loaded) / file.size) * 100)
            );
          }
        },
      });

      uploadedBytes += end - start;
      onProgress?.(Math.round((uploadedBytes / file.size) * 100));
    }

    await completeMultipartRequest({
      fileKey, uploadId, fileName: file.name, fileType: file.type,
      fileSize: file.size, courseId, lessonId, fileUrl,
    });

    return { fileKey, fileUrl, resourceType };
  } catch (err) {
    await abortMultipartRequest({ fileKey, uploadId });
    throw err;
  }
};

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import s3Client from "../config/s3.js";

const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const CLOUDFRONT = process.env.AWS_CLOUDFRONT_URL;

export const generatePresignedUploadUrl = async ({ fileName, fileType, s3Key }) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  const ext = fileName.split(".").pop().toLowerCase();
  const fileKey = s3Key || `uploads/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: fileType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  const fileUrl = CLOUDFRONT
    ? `${CLOUDFRONT.replace(/\/$/, "")}/${fileKey}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileKey}`;

  return { presignedUrl, fileKey, fileUrl };
};

export const deleteS3Object = async (fileKey) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey });
  return s3Client.send(command);
};

const buildFileUrl = (fileKey) =>
  CLOUDFRONT
    ? `${CLOUDFRONT.replace(/\/$/, "")}/${fileKey}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileKey}`;

// ── Multipart upload helpers ──────────────────────────────────────────────────
// NOTE: S3 bucket CORS must expose the ETag response header for browser clients.
// Recommended CORS ExposeHeaders: ["ETag"]

export const createMultipartUpload = async ({ fileKey, fileType }) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: fileType,
  });
  const { UploadId } = await s3Client.send(command);
  return { uploadId: UploadId, fileKey, fileUrl: buildFileUrl(fileKey) };
};

export const generatePartPresignedUrl = async ({ fileKey, uploadId, partNumber }) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");
  const command = new UploadPartCommand({
    Bucket: BUCKET,
    Key: fileKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

// Lists uploaded parts from S3 (used to gather ETags server-side for completion)
export const listUploadedParts = async ({ fileKey, uploadId }) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");
  const command = new ListPartsCommand({ Bucket: BUCKET, Key: fileKey, UploadId: uploadId });
  const { Parts } = await s3Client.send(command);
  return (Parts || []).map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber }));
};

export const finishMultipartUpload = async ({ fileKey, uploadId }) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");
  const parts = await listUploadedParts({ fileKey, uploadId });
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: fileKey,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  return s3Client.send(command);
};

export const abortMultipartUpload = async ({ fileKey, uploadId }) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET_NAME is not configured");
  const command = new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: fileKey, UploadId: uploadId });
  return s3Client.send(command);
};

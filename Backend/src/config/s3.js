import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

// Ensure env vars are loaded before checking credentials.
// In ES modules, this file may be imported before server.js body runs dotenv.config().
dotenv.config();

const REQUIRED_VARS = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET_NAME",
];

const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.warn("[S3] Missing AWS config — uploads will fail until .env is set:");
  missing.forEach((v) => console.warn(`       missing: ${v}`));
} else {
  console.log(`✓ AWS configured  (region: ${process.env.AWS_REGION}, bucket: ${process.env.AWS_S3_BUCKET_NAME})`);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export default s3Client;

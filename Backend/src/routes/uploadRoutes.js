import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { deleteUpload, getPresignedUrl } from "../controllers/uploadController.js";
import {
  initiateMultipart, getPartUrl, completeMultipart, abortMultipart,
} from "../controllers/multipartController.js";

const router = Router();

router.use(protect, allowRoles("teacher", "admin"));

router.post("/presigned-url", getPresignedUrl);
router.post("/delete", deleteUpload);

// ── Multipart upload (for large videos and files > 50 MB)
router.post("/multipart/initiate", initiateMultipart);
router.post("/multipart/part-url", getPartUrl);
router.post("/multipart/complete", completeMultipart);
router.post("/multipart/abort", abortMultipart);

export default router;

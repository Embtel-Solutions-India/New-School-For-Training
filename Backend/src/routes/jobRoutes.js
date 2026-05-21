import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import {
  getJobs,
  getRecommendedJobs,
  getMyApplications,
  getSavedJobs,
  getMyJobPostings,
  updateApplicationStatus,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  toggleSaveJob,
  getJobApplicants,
} from "../controllers/jobController.js";

const router = Router();

// ── Root routes
router.get("/", protect, allowRoles("student", "teacher", "admin"), getJobs);
router.post("/", protect, allowRoles("teacher", "admin"), createJob);

// ── Static sub-routes (MUST come before /:id)
router.get("/recommended", protect, allowRoles("student"), getRecommendedJobs);
router.get("/my-applications", protect, allowRoles("student"), getMyApplications);
router.get("/saved", protect, allowRoles("student"), getSavedJobs);
router.get("/my-postings", protect, allowRoles("teacher", "admin"), getMyJobPostings);
router.patch("/applications/:appId/status", protect, allowRoles("teacher", "admin"), updateApplicationStatus);

// ── Parameterized routes (AFTER static routes)
router.get("/:id", protect, allowRoles("student", "teacher", "admin"), getJobById);
router.patch("/:id", protect, allowRoles("teacher", "admin"), updateJob);
router.delete("/:id", protect, allowRoles("teacher", "admin"), deleteJob);
router.post("/:id/apply", protect, allowRoles("student"), applyJob);
router.post("/:id/save", protect, allowRoles("student"), toggleSaveJob);
router.get("/:id/applicants", protect, allowRoles("teacher", "admin"), getJobApplicants);

export default router;

import express from "express";
import { getUserById, getUsers, updateUserRole } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles, allowSelfOrRoles } from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", allowRoles("admin"), getUsers);
router.get("/:id", allowSelfOrRoles("admin"), getUserById);
router.patch("/:id/role", allowRoles("admin"), updateUserRole);

export default router;

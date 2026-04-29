import { Router } from "express";
import { resultController } from "../controllers/result.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// --- Student Report Card ---
router.get(
  "/student/:studentId",
  resultController.getStudentResult
);

// --- Class Broadsheet ---
router.get(
  "/class/:classId",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  resultController.getClassResults
);

export default router;

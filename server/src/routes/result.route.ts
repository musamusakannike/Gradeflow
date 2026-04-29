import { Router } from "express";
import { resultController } from "../controllers/result.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { resultValidation } from "../validations/result.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// --- Result Lifecycle ---
router.post(
  "/compile",
  authorize(UserRole.SCHOOL_ADMIN),
  validateRequest(resultValidation.classTermBody),
  resultController.compileResult,
);

router.post(
  "/release",
  authorize(UserRole.SCHOOL_ADMIN),
  validateRequest(resultValidation.classTermBody),
  resultController.releaseResult,
);

router.post(
  "/unrelease",
  authorize(UserRole.SCHOOL_ADMIN),
  validateRequest(resultValidation.classTermBody),
  resultController.unreleaseResult,
);

router.get(
  "/status",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validateRequest(resultValidation.status),
  resultController.getResultStatus,
);

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

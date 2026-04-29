import { Router } from "express";
import { scoreController } from "../controllers/score.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { scoreValidation } from "../validations/score.validation";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

// --- Score Management ---
router.post(
  "/",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validateRequest(scoreValidation.enterScore),
  scoreController.enterScore
);

router.post(
  "/bulk",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validateRequest(scoreValidation.bulkEnterScores),
  scoreController.bulkEnterScores
);

// --- Subject Performance ---
router.get(
  "/subject/:classSubjectId",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  scoreController.getSubjectScores
);

export default router;

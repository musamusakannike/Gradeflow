import { Router } from "express";
import { academicController } from "../controllers/academic.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import {
  createSessionSchema,
  updateTermSchema,
} from "../validations/academic.validation";
import { UserRole } from "../types";

const router = Router();

// All academic routes require authentication
router.use(authenticate);

// --- Session Routes ---

router
  .route("/sessions")
  .get(academicController.getSessions)
  .post(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(createSessionSchema),
    academicController.createSession
  );

router.patch(
  "/sessions/:id/current",
  authorize(UserRole.SCHOOL_ADMIN),
  academicController.setCurrentSession
);

// --- Term Routes ---

router
  .route("/terms")
  .get(academicController.getTerms);

router
  .route("/terms/:id")
  .patch(
    authorize(UserRole.SCHOOL_ADMIN),
    validateRequest(updateTermSchema),
    academicController.updateTerm
  );

router.patch(
  "/terms/:id/current",
  authorize(UserRole.SCHOOL_ADMIN),
  academicController.setCurrentTerm
);

export default router;

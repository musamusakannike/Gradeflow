import { Router } from "express";
import { financeController } from "../controllers/finance.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { financeValidation } from "../validations/finance.validation";
import { UserRole } from "../types";

const router = Router();

// Webhook is public but verified with signature inside controller
router.post("/webhook", financeController.handleWebhook);

router.use(authenticate);

// --- Payment Actions ---
router.post(
  "/payments/initialize",
  validateRequest(financeValidation.initializePayment),
  financeController.initializePayment
);

router.get(
  "/payments/verify",
  validateRequest(financeValidation.verifyPayment),
  financeController.verifyPayment
);

router.get(
  "/payments/student/:studentId",
  financeController.getStudentPayments
);

// --- Fee Status Management ---
router.get(
  "/fee-status/:studentId",
  financeController.getStudentFeeStatus
);

router.post(
  "/fee-status",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.BURSAR),
  validateRequest(financeValidation.setFeeStatus),
  financeController.setFeeStatus
);

// --- Statistics ---
router.get(
  "/stats/:termId",
  authorize(UserRole.SCHOOL_ADMIN, UserRole.BURSAR),
  financeController.getTermStats
);

export default router;

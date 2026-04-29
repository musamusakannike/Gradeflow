import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { authValidation } from "../validations/auth.validation";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * Public Routes
 */
router.post(
  "/register-school",
  validateRequest(authValidation.registerSchool),
  authController.registerSchool,
);

router.post(
  "/login",
  validateRequest(authValidation.login),
  authController.login,
);

router.post(
  "/google",
  validateRequest(authValidation.googleAuth),
  authController.googleAuth,
);

router.post(
  "/refresh-token",
  validateRequest(authValidation.refreshToken),
  authController.refreshToken,
);

router.post(
  "/forgot-password",
  validateRequest(authValidation.forgotPassword),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(authValidation.resetPassword),
  authController.resetPassword,
);

/**
 * Protected Routes
 */
router.use(authenticate);

router.get("/me", authController.getMe);

router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  authController.changePassword,
);

router.put(
  "/push-token",
  validateRequest(authValidation.updatePushToken),
  authController.updatePushToken,
);

export default router;

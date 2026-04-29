"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Public Routes
 */
router.post("/register-school", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.registerSchool), auth_controller_1.authController.registerSchool);
router.post("/login", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.login), auth_controller_1.authController.login);
router.post("/google", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.googleAuth), auth_controller_1.authController.googleAuth);
router.post("/refresh-token", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.refreshToken), auth_controller_1.authController.refreshToken);
router.post("/forgot-password", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.forgotPassword), auth_controller_1.authController.forgotPassword);
router.post("/reset-password", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.resetPassword), auth_controller_1.authController.resetPassword);
/**
 * Protected Routes
 */
router.use(auth_middleware_1.authenticate);
router.get("/me", auth_controller_1.authController.getMe);
router.post("/change-password", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.changePassword), auth_controller_1.authController.changePassword);
router.put("/push-token", (0, validation_middleware_1.validateRequest)(auth_validation_1.authValidation.updatePushToken), auth_controller_1.authController.updatePushToken);
exports.default = router;
//# sourceMappingURL=auth.route.js.map
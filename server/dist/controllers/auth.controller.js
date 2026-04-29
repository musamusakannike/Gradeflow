"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const response_util_1 = require("../utils/response.util");
/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */
class AuthController {
    /**
     * Register a new school
     * POST /api/v1/auth/register-school
     */
    async registerSchool(req, res, next) {
        try {
            const result = await (0, auth_service_1.registerSchool)(req.body);
            (0, response_util_1.sendSuccess)(res, result, "School registered successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Login user
     * POST /api/v1/auth/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await (0, auth_service_1.login)(email, password);
            (0, response_util_1.sendSuccess)(res, result, "Login successful");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Google authentication
     * POST /api/v1/auth/google
     */
    async googleAuth(req, res, next) {
        try {
            const { idToken, schoolCode } = req.body;
            const result = await (0, auth_service_1.loginWithGoogle)(idToken, schoolCode);
            (0, response_util_1.sendSuccess)(res, result, "Google authentication successful");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refresh access token
     * POST /api/v1/auth/refresh-token
     */
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await (0, auth_service_1.refreshAccessToken)(refreshToken);
            (0, response_util_1.sendSuccess)(res, result, "Token refreshed successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Forgot password - send reset email
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            await (0, auth_service_1.requestPasswordReset)(email);
            (0, response_util_1.sendSuccess)(res, null, "Password reset email sent");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reset password
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            await (0, auth_service_1.resetPassword)(token, newPassword);
            (0, response_util_1.sendSuccess)(res, null, "Password reset successful");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Change password
     * POST /api/v1/auth/change-password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user._id;
            await (0, auth_service_1.changePassword)(userId, currentPassword, newPassword);
            (0, response_util_1.sendSuccess)(res, null, "Password changed successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current user profile
     * GET /api/v1/auth/me
     */
    async getMe(req, res, next) {
        try {
            const userId = req.user._id;
            const user = await (0, auth_service_1.getUserProfile)(userId);
            (0, response_util_1.sendSuccess)(res, user, "Profile retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update push token for notifications
     * PUT /api/v1/auth/push-token
     */
    async updatePushToken(req, res, next) {
        try {
            const userId = req.user._id;
            const { pushToken } = req.body;
            await (0, auth_service_1.updatePushToken)(userId, pushToken);
            (0, response_util_1.sendSuccess)(res, null, "Push token updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map
import { Request, Response, NextFunction } from "express";
import {
  registerSchool,
  login,
  changePassword,
  loginWithGoogle,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  getUserProfile,
  updatePushToken,
} from "../services/auth.service";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";

/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */
class AuthController {
  /**
   * Register a new school
   * POST /api/v1/auth/register-school
   */
  async registerSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await registerSchool(req.body);
      sendSuccess(res, result, "School registered successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await login(email, password);
      sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google authentication
   * POST /api/v1/auth/google
   */
  async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { idToken, schoolCode } = req.body;
      const result = await loginWithGoogle(idToken, schoolCode);
      sendSuccess(res, result, "Google authentication successful");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await refreshAccessToken(refreshToken);
      sendSuccess(res, result, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password - send reset email
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.body;
      await requestPasswordReset(email);
      sendSuccess(res, null, "Password reset email sent");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      await resetPassword(token, newPassword);
      sendSuccess(res, null, "Password reset successful");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!._id;
      await changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getMe(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!._id;
      const user = await getUserProfile(userId);
      sendSuccess(res, user, "Profile retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update push token for notifications
   * PUT /api/v1/auth/push-token
   */
  async updatePushToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!._id;
      const { pushToken } = req.body;
      await updatePushToken(userId, pushToken);
      sendSuccess(res, null, "Push token updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

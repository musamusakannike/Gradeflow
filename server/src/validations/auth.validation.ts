import { z } from "zod";

/**
 * Authentication validation schemas
 */
export const authValidation = {
  registerSchool: z.object({
    body: z.object({
      schoolName: z.string().min(3, "School name must be at least 3 characters"),
      schoolCode: z.string().min(2, "School code must be at least 2 characters"),
      adminEmail: z.string().email("Invalid email address"),
      adminPassword: z.string().min(8, "Password must be at least 8 characters"),
      adminFirstName: z.string().min(2, "First name is required"),
      adminLastName: z.string().min(2, "Last name is required"),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    }),
  }),

  googleAuth: z.object({
    body: z.object({
      idToken: z.string().min(1, "Google ID token is required"),
      schoolCode: z.string().optional(),
    }),
  }),

  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
    }),
  }),

  resetPassword: z.object({
    body: z.object({
      token: z.string().min(1, "Reset token is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }),
  }),

  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
    }),
  }),

  updatePushToken: z.object({
    body: z.object({
      pushToken: z.string().min(1, "Push token is required"),
    }),
  }),
};

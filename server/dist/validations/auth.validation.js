"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
/**
 * Authentication validation schemas
 */
exports.authValidation = {
    registerSchool: zod_1.z.object({
        body: zod_1.z.object({
            schoolName: zod_1.z.string().min(3, "School name must be at least 3 characters"),
            schoolCode: zod_1.z.string().min(2, "School code must be at least 2 characters"),
            adminEmail: zod_1.z.string().email("Invalid email address"),
            adminPassword: zod_1.z.string().min(8, "Password must be at least 8 characters"),
            adminFirstName: zod_1.z.string().min(2, "First name is required"),
            adminLastName: zod_1.z.string().min(2, "Last name is required"),
        }),
    }),
    login: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email("Invalid email address"),
            password: zod_1.z.string().min(1, "Password is required"),
        }),
    }),
    googleAuth: zod_1.z.object({
        body: zod_1.z.object({
            idToken: zod_1.z.string().min(1, "Google ID token is required"),
            schoolCode: zod_1.z.string().optional(),
        }),
    }),
    refreshToken: zod_1.z.object({
        body: zod_1.z.object({
            refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
        }),
    }),
    forgotPassword: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email("Invalid email address"),
        }),
    }),
    resetPassword: zod_1.z.object({
        body: zod_1.z.object({
            token: zod_1.z.string().min(1, "Reset token is required"),
            newPassword: zod_1.z.string().min(8, "Password must be at least 8 characters"),
        }),
    }),
    changePassword: zod_1.z.object({
        body: zod_1.z.object({
            currentPassword: zod_1.z.string().min(1, "Current password is required"),
            newPassword: zod_1.z.string().min(8, "New password must be at least 8 characters"),
        }),
    }),
    updatePushToken: zod_1.z.object({
        body: zod_1.z.object({
            pushToken: zod_1.z.string().min(1, "Push token is required"),
        }),
    }),
};
//# sourceMappingURL=auth.validation.js.map
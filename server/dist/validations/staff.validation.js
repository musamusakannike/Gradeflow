"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffValidation = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.staffValidation = {
    createStaff: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email("Invalid email address"),
            firstName: zod_1.z.string().min(2, "First name must be at least 2 characters"),
            lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters"),
            phone: zod_1.z.string().optional(),
            role: zod_1.z.enum([types_1.UserRole.TEACHER, types_1.UserRole.BURSAR, types_1.UserRole.SCHOOL_ADMIN], {
                message: "Invalid staff role",
            }),
        }),
    }),
    updateStaff: zod_1.z.object({
        body: zod_1.z.object({
            firstName: zod_1.z.string().min(2).optional(),
            lastName: zod_1.z.string().min(2).optional(),
            phone: zod_1.z.string().optional(),
            role: zod_1.z.enum([types_1.UserRole.TEACHER, types_1.UserRole.BURSAR, types_1.UserRole.SCHOOL_ADMIN]).optional(),
            status: zod_1.z.enum(["active", "inactive", "suspended"]).optional(),
        }),
    }),
};
//# sourceMappingURL=staff.validation.js.map
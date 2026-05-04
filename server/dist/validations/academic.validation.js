"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTermSchema = exports.updateTermSchema = exports.updateSessionSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
/**
 * Academic Session Validation Schemas
 */
exports.createSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        startYear: zod_1.z.number().min(2000, "Start year must be after 2000"),
        isCurrent: zod_1.z.boolean().optional().default(false),
    }),
});
exports.updateSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        isCurrent: zod_1.z.boolean().optional(),
    }),
});
/**
 * Academic Term Validation Schemas
 */
exports.updateTermSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        isCurrent: zod_1.z.boolean().optional(),
    }),
});
exports.createTermSchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionId: zod_1.z.string().min(1, "Session ID is required"),
        termNumber: zod_1.z.number().min(1, "Term number must be at least 1").max(3, "Term number cannot exceed 3"),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        isCurrent: zod_1.z.boolean().optional().default(false),
    }),
});
//# sourceMappingURL=academic.validation.js.map
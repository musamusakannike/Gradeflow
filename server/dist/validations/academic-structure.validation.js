"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classSubjectValidation = exports.subjectValidation = exports.classValidation = void 0;
const zod_1 = require("zod");
exports.classValidation = {
    createClass: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(2, "Class name must be at least 2 characters").max(50),
            level: zod_1.z.number().min(1).max(12),
            section: zod_1.z.string().max(5).optional(),
            classTeacherId: zod_1.z.string().optional().nullable(),
            capacity: zod_1.z.number().min(10).max(200).optional(),
        }),
    }),
    updateClass: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(2).max(50).optional(),
            level: zod_1.z.number().min(1).max(12).optional(),
            section: zod_1.z.string().max(5).optional(),
            classTeacherId: zod_1.z.string().optional().nullable(),
            capacity: zod_1.z.number().min(10).max(200).optional(),
        }),
    }),
};
exports.subjectValidation = {
    createSubject: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(2, "Subject name must be at least 2 characters").max(100),
            code: zod_1.z.string().min(1).max(10).optional(),
            description: zod_1.z.string().max(500).optional(),
            isActive: zod_1.z.boolean().optional(),
        }),
    }),
    updateSubject: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(2).max(100).optional(),
            code: zod_1.z.string().min(1).max(10).optional(),
            description: zod_1.z.string().max(500).optional(),
            isActive: zod_1.z.boolean().optional(),
        }),
    }),
};
exports.classSubjectValidation = {
    assignSubject: zod_1.z.object({
        body: zod_1.z.object({
            classId: zod_1.z.string().min(1, "Class ID is required"),
            subjectId: zod_1.z.string().min(1, "Subject ID is required"),
            teacherId: zod_1.z.string().min(1, "Teacher ID is required"),
            sessionId: zod_1.z.string().min(1, "Session ID is required"),
        }),
    }),
    updateAssignment: zod_1.z.object({
        body: zod_1.z.object({
            teacherId: zod_1.z.string().min(1, "Teacher ID is required"),
        }),
    }),
};
//# sourceMappingURL=academic-structure.validation.js.map
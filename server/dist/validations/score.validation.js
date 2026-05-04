"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreValidation = void 0;
const zod_1 = require("zod");
exports.scoreValidation = {
    enterScore: zod_1.z.object({
        body: zod_1.z.object({
            studentId: zod_1.z.string().min(1, "Student ID is required"),
            classSubjectId: zod_1.z.string().min(1, "Class Subject ID is required"),
            termId: zod_1.z.string().min(1, "Term ID is required"),
            test1: zod_1.z.number().min(0).max(20).optional(),
            test2: zod_1.z.number().min(0).max(20).optional(),
            exam: zod_1.z.number().min(0).max(60).optional(),
        }),
    }),
    bulkEnterScores: zod_1.z.object({
        body: zod_1.z.object({
            classSubjectId: zod_1.z.string().min(1, "Class Subject ID is required"),
            termId: zod_1.z.string().min(1, "Term ID is required"),
            scores: zod_1.z.array(zod_1.z.object({
                studentId: zod_1.z.string().min(1, "Student ID is required"),
                test1: zod_1.z.number().min(0).max(20).optional(),
                test2: zod_1.z.number().min(0).max(20).optional(),
                exam: zod_1.z.number().min(0).max(60).optional(),
            })).min(1, "At least one score is required"),
        }),
    }),
};
//# sourceMappingURL=score.validation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolValidation = void 0;
const zod_1 = require("zod");
const gradeSchema = zod_1.z.object({
    min: zod_1.z.number().min(0).max(100),
    max: zod_1.z.number().min(0).max(100),
    grade: zod_1.z.string().min(1).max(10),
    remark: zod_1.z.string().min(1).max(100),
});
exports.schoolValidation = {
    updateProfile: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(3).max(200).optional(),
            email: zod_1.z.string().email().optional(),
            phone: zod_1.z.string().min(3).optional(),
            address: zod_1.z.string().min(3).optional(),
            city: zod_1.z.string().min(2).optional(),
            state: zod_1.z.string().min(2).optional(),
            logo: zod_1.z.string().url().nullable().optional(),
            motto: zod_1.z.string().max(500).optional(),
            established: zod_1.z.number().min(1800).max(new Date().getFullYear()).optional(),
            settings: zod_1.z
                .object({
                maxStudentsPerClass: zod_1.z.number().min(10).max(200).optional(),
                gradingScale: zod_1.z.enum(["default", "custom"]).optional(),
                customGrades: zod_1.z.array(gradeSchema).optional(),
                resultReleaseMode: zod_1.z.enum(["automatic", "manual"]).optional(),
            })
                .optional(),
        }),
    }),
};
//# sourceMappingURL=school.validation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultValidation = void 0;
const zod_1 = require("zod");
exports.resultValidation = {
    classTermBody: zod_1.z.object({
        body: zod_1.z.object({
            classId: zod_1.z.string().min(1, "Class ID is required"),
            termId: zod_1.z.string().min(1, "Term ID is required"),
        }),
    }),
    status: zod_1.z.object({
        query: zod_1.z.object({
            classId: zod_1.z.string().min(1, "Class ID is required"),
            termId: zod_1.z.string().min(1, "Term ID is required"),
        }),
    }),
};
//# sourceMappingURL=result.validation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeValidation = void 0;
const zod_1 = require("zod");
exports.financeValidation = {
    initializePayment: zod_1.z.object({
        body: zod_1.z.object({
            studentId: zod_1.z.string().min(1, "Student ID is required"),
            termId: zod_1.z.string().min(1, "Term ID is required"),
            amount: zod_1.z.number().min(100, "Minimum payment is 100 NGN"),
            callbackUrl: zod_1.z.string().url().optional(),
        }),
    }),
    verifyPayment: zod_1.z.object({
        query: zod_1.z.object({
            reference: zod_1.z.string().min(1, "Payment reference is required"),
        }),
    }),
    setFeeStatus: zod_1.z.object({
        body: zod_1.z.object({
            studentId: zod_1.z.string().min(1, "Student ID is required"),
            termId: zod_1.z.string().min(1, "Term ID is required"),
            amountExpected: zod_1.z.number().min(0),
            amountPaid: zod_1.z.number().min(0).optional(),
            notes: zod_1.z.string().optional(),
        }),
    }),
};
//# sourceMappingURL=finance.validation.js.map
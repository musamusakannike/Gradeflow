import { z } from "zod";

export const financeValidation = {
  initializePayment: z.object({
    body: z.object({
      studentId: z.string().min(1, "Student ID is required"),
      termId: z.string().min(1, "Term ID is required"),
      amount: z.number().min(100, "Minimum payment is 100 NGN"),
      callbackUrl: z.string().url().optional(),
    }),
  }),

  verifyPayment: z.object({
    query: z.object({
      reference: z.string().min(1, "Payment reference is required"),
    }),
  }),

  setFeeStatus: z.object({
    body: z.object({
      studentId: z.string().min(1, "Student ID is required"),
      termId: z.string().min(1, "Term ID is required"),
      amountExpected: z.number().min(0),
      amountPaid: z.number().min(0).optional(),
      notes: z.string().optional(),
    }),
  }),
};

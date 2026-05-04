import { z } from "zod";

export const resultValidation = {
  classTermBody: z.object({
    body: z.object({
      classId: z.string().min(1, "Class ID is required"),
      termId: z.string().min(1, "Term ID is required"),
    }),
  }),

  status: z.object({
    query: z.object({
      classId: z.string().min(1, "Class ID is required"),
      termId: z.string().min(1, "Term ID is required"),
    }),
  }),
};

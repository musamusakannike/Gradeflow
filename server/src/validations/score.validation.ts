import { z } from "zod";

export const scoreValidation = {
  enterScore: z.object({
    body: z.object({
      studentId: z.string().min(1, "Student ID is required"),
      classSubjectId: z.string().min(1, "Class Subject ID is required"),
      termId: z.string().min(1, "Term ID is required"),
      test1: z.number().min(0).max(20).optional(),
      test2: z.number().min(0).max(20).optional(),
      exam: z.number().min(0).max(60).optional(),
    }),
  }),

  bulkEnterScores: z.object({
    body: z.object({
      classSubjectId: z.string().min(1, "Class Subject ID is required"),
      termId: z.string().min(1, "Term ID is required"),
      scores: z.array(
        z.object({
          studentId: z.string().min(1, "Student ID is required"),
          test1: z.number().min(0).max(20).optional(),
          test2: z.number().min(0).max(20).optional(),
          exam: z.number().min(0).max(60).optional(),
        })
      ).min(1, "At least one score is required"),
    }),
  }),
};

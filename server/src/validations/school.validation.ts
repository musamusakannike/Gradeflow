import { z } from "zod";

const gradeSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  grade: z.string().min(1).max(10),
  remark: z.string().min(1).max(100),
});

export const schoolValidation = {
  updateProfile: z.object({
    body: z.object({
      name: z.string().min(3).max(200).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(3).optional(),
      address: z.string().min(3).optional(),
      city: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      logo: z.string().url().nullable().optional(),
      motto: z.string().max(500).optional(),
      established: z.number().min(1800).max(new Date().getFullYear()).optional(),
      settings: z
        .object({
          maxStudentsPerClass: z.number().min(10).max(200).optional(),
          gradingScale: z.enum(["default", "custom"]).optional(),
          customGrades: z.array(gradeSchema).optional(),
          resultReleaseMode: z.enum(["automatic", "manual"]).optional(),
        })
        .optional(),
    }),
  }),
};

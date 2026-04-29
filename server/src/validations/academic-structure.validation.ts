import { z } from "zod";

export const classValidation = {
  createClass: z.object({
    body: z.object({
      name: z.string().min(2, "Class name must be at least 2 characters").max(50),
      level: z.number().min(1).max(12),
      section: z.string().max(5).optional(),
      classTeacherId: z.string().optional().nullable(),
      capacity: z.number().min(10).max(200).optional(),
    }),
  }),

  updateClass: z.object({
    body: z.object({
      name: z.string().min(2).max(50).optional(),
      level: z.number().min(1).max(12).optional(),
      section: z.string().max(5).optional(),
      classTeacherId: z.string().optional().nullable(),
      capacity: z.number().min(10).max(200).optional(),
    }),
  }),
};

export const subjectValidation = {
  createSubject: z.object({
    body: z.object({
      name: z.string().min(2, "Subject name must be at least 2 characters").max(100),
      code: z.string().min(1).max(10).optional(),
      description: z.string().max(500).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  updateSubject: z.object({
    body: z.object({
      name: z.string().min(2).max(100).optional(),
      code: z.string().min(1).max(10).optional(),
      description: z.string().max(500).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
};

export const classSubjectValidation = {
  assignSubject: z.object({
    body: z.object({
      classId: z.string().min(1, "Class ID is required"),
      subjectId: z.string().min(1, "Subject ID is required"),
      teacherId: z.string().min(1, "Teacher ID is required"),
      sessionId: z.string().min(1, "Session ID is required"),
    }),
  }),
  
  updateAssignment: z.object({
    body: z.object({
      teacherId: z.string().min(1, "Teacher ID is required"),
    }),
  }),
};

import { z } from "zod";

/**
 * Academic Session Validation Schemas
 */
export const createSessionSchema = z.object({
  body: z.object({
    startYear: z.number().min(2000, "Start year must be after 2000"),
    isCurrent: z.boolean().optional().default(false),
  }),
});

export const updateSessionSchema = z.object({
  body: z.object({
    isCurrent: z.boolean().optional(),
  }),
});

/**
 * Academic Term Validation Schemas
 */
export const updateTermSchema = z.object({
  body: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isCurrent: z.boolean().optional(),
  }),
});

export const createTermSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    termNumber: z.number().min(1, "Term number must be at least 1").max(3, "Term number cannot exceed 3"),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isCurrent: z.boolean().optional().default(false),
  }),
});

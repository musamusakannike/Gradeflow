import { z } from "zod";
import { UserRole } from "../types";

export const staffValidation = {
  createStaff: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      phone: z.string().optional(),
      role: z.enum([UserRole.TEACHER, UserRole.BURSAR, UserRole.SCHOOL_ADMIN], {
        message: "Invalid staff role",
      }),
    }),
  }),

  updateStaff: z.object({
    body: z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      phone: z.string().optional(),
      role: z.enum([UserRole.TEACHER, UserRole.BURSAR, UserRole.SCHOOL_ADMIN]).optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }),
  }),
};

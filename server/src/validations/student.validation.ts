import { z } from "zod";
import { StudentStatus } from "../types";

export const studentValidation = {
  createStudent: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      middleName: z.string().optional(),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      dateOfBirth: z.string().datetime().optional(),
      gender: z.enum(["male", "female"], {
        message: "Gender must be either male or female",
      }),
      address: z.string().optional(),
      phoneNumber: z.string().optional(),
      guardianName: z.string().min(2, "Guardian name is required"),
      guardianEmail: z.string().email("Invalid guardian email").optional().or(z.literal("")),
      guardianPhone: z.string().min(10, "Guardian phone is required"),
      guardianRelationship: z.string().optional(),
      classId: z.string().min(1, "Class ID is required"),
      admissionDate: z.string().datetime().optional(),
    }),
  }),

  updateStudent: z.object({
    body: z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      middleName: z.string().optional(),
      email: z.string().email().optional(),
      dateOfBirth: z.string().datetime().optional(),
      gender: z.enum(["male", "female"]).optional(),
      address: z.string().optional(),
      phoneNumber: z.string().optional(),
      guardianName: z.string().optional(),
      guardianEmail: z.string().email().optional(),
      guardianPhone: z.string().optional(),
      guardianRelationship: z.string().optional(),
      classId: z.string().optional(),
      status: z.nativeEnum(StudentStatus).optional(),
    }),
  }),

  bulkCreate: z.object({
    body: z.object({
      classId: z.string().min(1, "Class ID is required"),
      students: z.array(
        z.object({
          firstName: z.string().min(2),
          lastName: z.string().min(2),
          middleName: z.string().optional(),
          email: z.string().email().optional(),
          dateOfBirth: z.string().optional(), // Allow string for CSV parsing later
          gender: z.enum(["male", "female"]),
          guardianName: z.string().min(2),
          guardianEmail: z.string().email().optional(),
          guardianPhone: z.string().min(10),
          guardianRelationship: z.string().optional(),
        })
      ).min(1, "At least one student is required"),
    }),
  }),

  createParentAccount: z.object({
    body: z.object({
      email: z.string().email("Invalid parent email").optional(),
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      phone: z.string().optional(),
    }),
  }),
};

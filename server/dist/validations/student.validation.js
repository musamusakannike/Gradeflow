"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentValidation = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.studentValidation = {
    createStudent: zod_1.z.object({
        body: zod_1.z.object({
            firstName: zod_1.z.string().min(2, "First name must be at least 2 characters"),
            lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters"),
            middleName: zod_1.z.string().optional(),
            email: zod_1.z.string().email("Invalid email address").optional().or(zod_1.z.literal("")),
            dateOfBirth: zod_1.z.string().datetime().optional(),
            gender: zod_1.z.enum(["male", "female"], {
                message: "Gender must be either male or female",
            }),
            address: zod_1.z.string().optional(),
            phoneNumber: zod_1.z.string().optional(),
            guardianName: zod_1.z.string().min(2, "Guardian name is required"),
            guardianEmail: zod_1.z.string().email("Invalid guardian email").optional().or(zod_1.z.literal("")),
            guardianPhone: zod_1.z.string().min(10, "Guardian phone is required"),
            guardianRelationship: zod_1.z.string().optional(),
            classId: zod_1.z.string().min(1, "Class ID is required"),
            admissionDate: zod_1.z.string().datetime().optional(),
        }),
    }),
    updateStudent: zod_1.z.object({
        body: zod_1.z.object({
            firstName: zod_1.z.string().min(2).optional(),
            lastName: zod_1.z.string().min(2).optional(),
            middleName: zod_1.z.string().optional(),
            email: zod_1.z.string().email().optional(),
            dateOfBirth: zod_1.z.string().datetime().optional(),
            gender: zod_1.z.enum(["male", "female"]).optional(),
            address: zod_1.z.string().optional(),
            phoneNumber: zod_1.z.string().optional(),
            guardianName: zod_1.z.string().optional(),
            guardianEmail: zod_1.z.string().email().optional(),
            guardianPhone: zod_1.z.string().optional(),
            guardianRelationship: zod_1.z.string().optional(),
            classId: zod_1.z.string().optional(),
            status: zod_1.z.nativeEnum(types_1.StudentStatus).optional(),
        }),
    }),
    bulkCreate: zod_1.z.object({
        body: zod_1.z.object({
            classId: zod_1.z.string().min(1, "Class ID is required"),
            students: zod_1.z.array(zod_1.z.object({
                firstName: zod_1.z.string().min(2),
                lastName: zod_1.z.string().min(2),
                middleName: zod_1.z.string().optional(),
                email: zod_1.z.string().email().optional(),
                dateOfBirth: zod_1.z.string().optional(), // Allow string for CSV parsing later
                gender: zod_1.z.enum(["male", "female"]),
                guardianName: zod_1.z.string().min(2),
                guardianEmail: zod_1.z.string().email().optional(),
                guardianPhone: zod_1.z.string().min(10),
                guardianRelationship: zod_1.z.string().optional(),
            })).min(1, "At least one student is required"),
        }),
    }),
};
//# sourceMappingURL=student.validation.js.map
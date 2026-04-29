"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const errors_util_1 = require("../utils/errors.util");
const helpers_util_1 = require("../utils/helpers.util");
const email_service_1 = require("./email.service");
const logger_util_1 = require("../utils/logger.util");
const types_1 = require("../types");
/**
 * Student Service
 * Handles all student-related operations
 */
class StudentService {
    /**
     * Create a new student
     */
    async createStudent(data) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Verify class exists and belongs to school
            const classDoc = await models_1.Class.findOne({
                _id: data.classId,
                school: data.schoolId,
                isActive: true,
            });
            if (!classDoc) {
                throw new errors_util_1.AppError("Class not found", 404);
            }
            // Generate student ID
            const schoolPrefix = data.schoolId.substring(0, 3).toUpperCase();
            const currentYear = new Date().getFullYear();
            const studentId = (0, helpers_util_1.generateStudentId)(schoolPrefix, currentYear);
            // Generate password for student account
            const password = (0, helpers_util_1.generateSecurePassword)();
            const hashedPassword = await (0, helpers_util_1.hashPassword)(password);
            // Create user account for student
            const user = new models_1.User({
                email: data.email || `${studentId.toLowerCase()}@student.gradeflow.com`,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: types_1.UserRole.STUDENT,
                school: data.schoolId,
                isActive: true,
            });
            await user.save({ session });
            // Create student record
            const student = new models_1.Student({
                userId: user._id,
                schoolId: data.schoolId,
                studentId,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                email: data.email,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                address: data.address,
                phoneNumber: data.phoneNumber,
                parentName: data.guardianName,
                parentEmail: data.guardianEmail,
                parentPhone: data.guardianPhone,
                classId: data.classId,
                admissionDate: data.admissionDate || new Date(),
                status: types_1.StudentStatus.ACTIVE,
            });
            await student.save({ session });
            await session.commitTransaction();
            // Send welcome email if guardian email exists
            if (data.guardianEmail) {
                try {
                    await (0, email_service_1.sendStudentCredentials)(data.guardianEmail, {
                        studentName: `${data.firstName} ${data.lastName}`,
                        studentId,
                        loginEmail: user.email,
                        password,
                        guardianName: data.guardianName,
                    });
                }
                catch (emailError) {
                    logger_util_1.logger.error("Failed to send student credentials email:", emailError);
                }
            }
            return student;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Get student by ID
     */
    async getStudentById(studentId, schoolId) {
        const student = await models_1.Student.findOne({
            _id: studentId,
            schoolId: schoolId,
        })
            .populate("user", "email isActive lastLogin")
            .populate("currentClass", "name section");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        return student;
    }
    /**
     * Get student by student ID number
     */
    async getStudentByStudentId(studentIdNumber, schoolId) {
        const student = await models_1.Student.findOne({
            studentId: studentIdNumber,
            schoolId: schoolId,
        })
            .populate("user", "email isActive lastLogin")
            .populate("currentClass", "name section");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        return student;
    }
    /**
     * Get all students for a school
     */
    async getStudentsBySchool(schoolId, options = {}) {
        const { page = 1, limit = 20, status, classId, search } = options;
        const skip = (page - 1) * limit;
        const query = { schoolId: schoolId };
        if (status) {
            query.status = status;
        }
        if (classId) {
            query.currentClass = classId;
        }
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { studentId: { $regex: search, $options: "i" } },
            ];
        }
        const [students, total] = await Promise.all([
            models_1.Student.find(query)
                .populate("user", "email isActive")
                .populate("currentClass", "name section")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            models_1.Student.countDocuments(query),
        ]);
        return {
            students,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Get students by class
     */
    async getStudentsByClass(classId, schoolId) {
        const students = await models_1.Student.find({
            classId,
            schoolId,
            status: types_1.StudentStatus.ACTIVE,
        })
            .populate("user", "email isActive")
            .sort({ lastName: 1, firstName: 1 });
        return students;
    }
    /**
     * Update student
     */
    async updateStudent(studentId, schoolId, data) {
        const student = await models_1.Student.findOneAndUpdate({ _id: studentId, schoolId: schoolId }, { $set: data }, { new: true, runValidators: true })
            .populate("user", "email isActive")
            .populate("currentClass", "name section");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        // Update user record if name changed
        if (data.firstName || data.lastName) {
            await models_1.User.findByIdAndUpdate(student.userId, {
                $set: {
                    ...(data.firstName && { firstName: data.firstName }),
                    ...(data.lastName && { lastName: data.lastName }),
                },
            });
        }
        return student;
    }
    /**
     * Transfer student to another class
     */
    async transferStudent(studentId, schoolId, newClassId) {
        // Verify new class exists
        const newClass = await models_1.Class.findOne({
            _id: newClassId,
            school: schoolId,
            isActive: true,
        });
        if (!newClass) {
            throw new errors_util_1.AppError("New class not found", 404);
        }
        const student = await models_1.Student.findOneAndUpdate({ _id: studentId, schoolId: schoolId }, { $set: { classId: newClassId } }, { new: true })
            .populate("user", "email isActive")
            .populate("currentClass", "name section");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        return student;
    }
    /**
     * Update student status
     */
    async updateStudentStatus(studentId, schoolId, status) {
        const student = await models_1.Student.findOneAndUpdate({ _id: studentId, schoolId: schoolId }, { $set: { status } }, { new: true })
            .populate("user", "email isActive")
            .populate("currentClass", "name section");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        // If student is graduated or transferred, deactivate user account
        if (status === types_1.StudentStatus.GRADUATED ||
            status === types_1.StudentStatus.TRANSFERRED) {
            await models_1.User.findByIdAndUpdate(student.userId, { isActive: false });
        }
        return student;
    }
    /**
     * Bulk create students
     */
    async bulkCreateStudents(schoolId, classId, studentsData) {
        const results = {
            created: 0,
            failed: 0,
            errors: [],
        };
        // Verify class exists
        const classDoc = await models_1.Class.findOne({
            _id: classId,
            school: schoolId,
            isActive: true,
        });
        if (!classDoc) {
            throw new errors_util_1.AppError("Class not found", 404);
        }
        for (let i = 0; i < studentsData.length; i++) {
            try {
                const studentData = studentsData[i];
                await this.createStudent({
                    ...studentData,
                    dateOfBirth: studentData.dateOfBirth
                        ? new Date(studentData.dateOfBirth)
                        : undefined,
                    classId,
                    schoolId,
                });
                results.created++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    index: i,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        return results;
    }
    /**
     * Delete student (soft delete)
     */
    async deleteStudent(studentId, schoolId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const student = await models_1.Student.findOne({
                _id: studentId,
                schoolId: schoolId,
            });
            if (!student) {
                throw new errors_util_1.AppError("Student not found", 404);
            }
            // Deactivate user account
            await models_1.User.findByIdAndUpdate(student.userId, { isActive: false }, { session });
            // Update student status
            await models_1.Student.findByIdAndUpdate(studentId, { status: types_1.StudentStatus.TRANSFERRED }, { session });
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Get student statistics
     */
    async getStudentStatistics(schoolId) {
        const [statusCounts, byClass] = await Promise.all([
            models_1.Student.aggregate([
                { $match: { schoolId: new mongoose_1.default.Types.ObjectId(schoolId) } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            models_1.Student.aggregate([
                {
                    $match: {
                        schoolId: new mongoose_1.default.Types.ObjectId(schoolId),
                        status: types_1.StudentStatus.ACTIVE,
                    },
                },
                {
                    $group: {
                        _id: "$currentClass",
                        count: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: "classes",
                        localField: "_id",
                        foreignField: "_id",
                        as: "class",
                    },
                },
                {
                    $unwind: "$class",
                },
                {
                    $project: {
                        classId: "$_id",
                        className: "$class.name",
                        count: 1,
                    },
                },
            ]),
        ]);
        const stats = {
            total: 0,
            active: 0,
            graduated: 0,
            transferred: 0,
            byClass: byClass.map((c) => ({
                classId: c.classId.toString(),
                className: c.className,
                count: c.count,
            })),
        };
        for (const item of statusCounts) {
            stats.total += item.count;
            if (item._id === types_1.StudentStatus.ACTIVE)
                stats.active = item.count;
            if (item._id === types_1.StudentStatus.GRADUATED)
                stats.graduated = item.count;
            if (item._id === types_1.StudentStatus.TRANSFERRED)
                stats.transferred = item.count;
        }
        return stats;
    }
    /**
     * Get student with fee status
     */
    async getStudentWithFeeStatus(studentId, termId, schoolId) {
        const student = await this.getStudentById(studentId, schoolId);
        const feeStatus = await models_1.FeeStatus.findOne({
            studentId: studentId,
            termId: termId,
            schoolId: schoolId,
        });
        return {
            student,
            feeStatus: feeStatus
                ? {
                    isPaid: feeStatus.status === "paid",
                    amount: feeStatus.amountPaid,
                    paidAt: feeStatus.updatedAt,
                }
                : { isPaid: false },
        };
    }
}
exports.studentService = new StudentService();
//# sourceMappingURL=student.service.js.map
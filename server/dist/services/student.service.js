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
                schoolId: data.schoolId,
            });
            if (!classDoc) {
                throw new errors_util_1.NotFoundError("Class not found");
            }
            const school = await models_1.School.findById(data.schoolId).select("code");
            if (!school) {
                throw new errors_util_1.NotFoundError("School not found");
            }
            if (data.email) {
                const existingUser = await models_1.User.findOne({
                    email: data.email.toLowerCase(),
                });
                if (existingUser) {
                    throw new errors_util_1.ConflictError("User with this email already exists");
                }
            }
            // Generate student ID
            const currentYear = new Date().getFullYear();
            const studentId = (0, helpers_util_1.generateStudentId)(school.code, currentYear);
            // Generate password for student account
            const password = (0, helpers_util_1.generateSecurePassword)();
            const loginEmail = data.email ||
                `${studentId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@student.gradeflow.local`;
            // Create user account for student
            const user = new models_1.User({
                email: loginEmail.toLowerCase(),
                password,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phoneNumber,
                role: types_1.UserRole.STUDENT,
                schoolId: data.schoolId,
                status: "active",
                emailVerified: false,
            });
            await user.save({ session });
            // Create student record
            const student = new models_1.Student({
                userId: user._id,
                schoolId: data.schoolId,
                studentId,
                dateOfBirth: data.dateOfBirth || new Date("2000-01-01"),
                gender: data.gender,
                address: data.address,
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
                        loginEmail,
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
            .populate("user", "email status lastLogin firstName lastName phone")
            .populate("parentUser", "email status firstName lastName phone")
            .populate("class", "name section level");
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
            .populate("user", "email status lastLogin firstName lastName phone")
            .populate("parentUser", "email status firstName lastName phone")
            .populate("class", "name section level");
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
        if (search) {
            const matchingUsers = await models_1.User.find({
                schoolId,
                role: types_1.UserRole.STUDENT,
                $or: [
                    { firstName: { $regex: search, $options: "i" } },
                    { lastName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            }).select("_id");
            query.$or = [
                { studentId: { $regex: search, $options: "i" } },
                { userId: { $in: matchingUsers.map((user) => user._id) } },
            ];
        }
        if (classId) {
            query.classId = classId;
        }
        const [students, total] = await Promise.all([
            models_1.Student.find(query)
                .populate("user", "email status firstName lastName")
                .populate("parentUser", "email status firstName lastName phone")
                .populate("class", "name section level")
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
    async getChildrenForParent(parentUserId, schoolId) {
        return models_1.Student.find({
            parentUserId,
            schoolId,
            status: types_1.StudentStatus.ACTIVE,
        })
            .populate("user", "email status firstName lastName")
            .populate("class", "name section level")
            .sort({ createdAt: -1 });
    }
    async createParentAccount(studentId, schoolId, data = {}) {
        const student = await models_1.Student.findOne({ _id: studentId, schoolId })
            .populate("user", "firstName lastName")
            .populate("class", "name section level");
        if (!student) {
            throw new errors_util_1.NotFoundError("Student not found");
        }
        if (student.parentUserId) {
            const parent = await models_1.User.findById(student.parentUserId);
            if (parent) {
                return { parent, student };
            }
        }
        const parentEmail = (data.email || student.parentEmail)?.toLowerCase();
        if (!parentEmail) {
            throw new errors_util_1.AppError("Parent email is required", 400);
        }
        const existingUser = await models_1.User.findOne({ email: parentEmail, schoolId });
        if (existingUser && existingUser.role !== types_1.UserRole.PARENT) {
            throw new errors_util_1.ConflictError("A non-parent user already uses this email");
        }
        let parent = existingUser;
        const temporaryPassword = (0, helpers_util_1.generateSecurePassword)();
        if (!parent) {
            const [fallbackFirstName, ...fallbackLastName] = student.parentName.split(" ");
            parent = await models_1.User.create({
                email: parentEmail,
                password: temporaryPassword,
                firstName: data.firstName || fallbackFirstName || "Parent",
                lastName: data.lastName || fallbackLastName.join(" ") || "Guardian",
                phone: data.phone || student.parentPhone,
                role: types_1.UserRole.PARENT,
                schoolId,
                status: "active",
                emailVerified: false,
            });
            const studentUser = student.userId;
            await (0, email_service_1.sendParentCredentials)(parentEmail, {
                studentName: `${studentUser?.firstName || ""} ${studentUser?.lastName || ""}`.trim() ||
                    student.studentId,
                loginEmail: parent.email,
                password: temporaryPassword,
                parentName: parent.firstName,
            });
        }
        student.parentUserId = parent._id;
        await student.save();
        return { parent, student };
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
            .populate("user", "email status firstName lastName")
            .sort({ studentId: 1 });
        return students;
    }
    /**
     * Update student
     */
    async updateStudent(studentId, schoolId, data) {
        if (data.classId) {
            const classDoc = await models_1.Class.findOne({ _id: data.classId, schoolId });
            if (!classDoc) {
                throw new errors_util_1.NotFoundError("Class not found");
            }
        }
        if (data.email) {
            const existingUser = await models_1.User.findOne({
                email: data.email.toLowerCase(),
                schoolId,
            });
            if (existingUser) {
                const currentStudent = await models_1.Student.findOne({ _id: studentId, schoolId });
                if (!currentStudent || existingUser._id.toString() !== currentStudent.userId.toString()) {
                    throw new errors_util_1.ConflictError("User with this email already exists");
                }
            }
        }
        const studentUpdates = {
            ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
            ...(data.gender && { gender: data.gender }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.guardianName !== undefined && { parentName: data.guardianName }),
            ...(data.guardianEmail !== undefined && { parentEmail: data.guardianEmail }),
            ...(data.guardianPhone !== undefined && { parentPhone: data.guardianPhone }),
            ...(data.classId && { classId: data.classId }),
            ...(data.status && { status: data.status }),
        };
        const student = await models_1.Student.findOneAndUpdate({ _id: studentId, schoolId: schoolId }, { $set: studentUpdates }, { new: true, runValidators: true })
            .populate("user", "email status firstName lastName phone")
            .populate("class", "name section level");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        // Update user record if name changed
        if (data.firstName || data.lastName || data.email || data.phoneNumber || data.status) {
            await models_1.User.findByIdAndUpdate(student.userId, {
                $set: {
                    ...(data.firstName && { firstName: data.firstName }),
                    ...(data.lastName && { lastName: data.lastName }),
                    ...(data.email && { email: data.email.toLowerCase() }),
                    ...(data.phoneNumber !== undefined && { phone: data.phoneNumber }),
                    ...(data.status && {
                        status: data.status === types_1.StudentStatus.ACTIVE ? "active" : "inactive",
                    }),
                },
            }, { runValidators: true });
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
            schoolId,
        });
        if (!newClass) {
            throw new errors_util_1.AppError("New class not found", 404);
        }
        const student = await models_1.Student.findOneAndUpdate({ _id: studentId, schoolId: schoolId }, { $set: { classId: newClassId } }, { new: true })
            .populate("user", "email status firstName lastName")
            .populate("class", "name section level");
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
            .populate("user", "email status firstName lastName")
            .populate("class", "name section level");
        if (!student) {
            throw new errors_util_1.AppError("Student not found", 404);
        }
        // If student is graduated or transferred, deactivate user account
        if (status === types_1.StudentStatus.GRADUATED ||
            status === types_1.StudentStatus.TRANSFERRED) {
            await models_1.User.findByIdAndUpdate(student.userId, { status: "inactive" });
        }
        else if (status === types_1.StudentStatus.ACTIVE) {
            await models_1.User.findByIdAndUpdate(student.userId, { status: "active" });
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
            schoolId,
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
            await models_1.User.findByIdAndUpdate(student.userId, { status: "inactive" }, { session });
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
                        _id: "$classId",
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
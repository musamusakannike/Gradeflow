import mongoose from "mongoose";
import { Student, User, Class, FeeStatus, Score } from "../models";
import { AppError } from "../utils/errors.util";
import {
  generateStudentId,
  generateSecurePassword,
  hashPassword,
} from "../utils/helpers.util";
import { sendStudentCredentials } from "./email.service";
import { logger } from "../utils/logger.util";
import { IStudent, StudentStatus, UserRole } from "../types";

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  dateOfBirth?: Date;
  gender: "male" | "female";
  address?: string;
  phoneNumber?: string;
  guardianName: string;
  guardianEmail?: string;
  guardianPhone: string;
  guardianRelationship?: string;
  classId: string;
  admissionDate?: Date;
  schoolId: string;
}

export interface UpdateStudentData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female";
  address?: string;
  phoneNumber?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  profileImage?: string;
}

export interface BulkStudentData {
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  dateOfBirth?: string;
  gender: "male" | "female";
  guardianName: string;
  guardianEmail?: string;
  guardianPhone: string;
  guardianRelationship?: string;
}

/**
 * Student Service
 * Handles all student-related operations
 */
class StudentService {
  /**
   * Create a new student
   */
  async createStudent(data: CreateStudentData): Promise<IStudent> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify class exists and belongs to school
      const classDoc = await Class.findOne({
        _id: data.classId,
        school: data.schoolId,
        isActive: true,
      });

      if (!classDoc) {
        throw new AppError("Class not found", 404);
      }

      // Generate student ID
      const schoolPrefix = data.schoolId.substring(0, 3).toUpperCase();
      const currentYear = new Date().getFullYear();
      const studentId = generateStudentId(schoolPrefix, currentYear);

      // Generate password for student account
      const password = generateSecurePassword();
      const hashedPassword = await hashPassword(password);

      // Create user account for student
      const user = new User({
        email: data.email || `${studentId.toLowerCase()}@student.gradeflow.com`,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.STUDENT,
        school: data.schoolId,
        isActive: true,
      });

      await user.save({ session });

      // Create student record
      const student = new Student({
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
        status: StudentStatus.ACTIVE,
      });

      await student.save({ session });

      await session.commitTransaction();

      // Send welcome email if guardian email exists
      if (data.guardianEmail) {
        try {
          await sendStudentCredentials(data.guardianEmail, {
            studentName: `${data.firstName} ${data.lastName}`,
            studentId,
            loginEmail: user.email,
            password,
            guardianName: data.guardianName,
          });
        } catch (emailError) {
          logger.error("Failed to send student credentials email:", emailError);
        }
      }

      return student;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(studentId: string, schoolId: string): Promise<IStudent> {
    const student = await Student.findOne({
      _id: studentId,
      schoolId: schoolId,
    })
      .populate("user", "email isActive lastLogin")
      .populate("currentClass", "name section");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return student;
  }

  /**
   * Get student by student ID number
   */
  async getStudentByStudentId(
    studentIdNumber: string,
    schoolId: string,
  ): Promise<IStudent> {
    const student = await Student.findOne({
      studentId: studentIdNumber,
      schoolId: schoolId,
    })
      .populate("user", "email isActive lastLogin")
      .populate("currentClass", "name section");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return student;
  }

  /**
   * Get all students for a school
   */
  async getStudentsBySchool(
    schoolId: string,
    options: {
      page?: number;
      limit?: number;
      status?: StudentStatus;
      classId?: string;
      search?: string;
    } = {},
  ): Promise<{
    students: IStudent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status, classId, search } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { schoolId: schoolId };

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
      Student.find(query)
        .populate("user", "email isActive")
        .populate("currentClass", "name section")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(query),
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
  async getStudentsByClass(
    classId: string,
    schoolId: string,
  ): Promise<IStudent[]> {
    const students = await Student.find({
      classId,
      schoolId,
      status: StudentStatus.ACTIVE,
    })
      .populate("user", "email isActive")
      .sort({ lastName: 1, firstName: 1 });

    return students;
  }

  /**
   * Update student
   */
  async updateStudent(
    studentId: string,
    schoolId: string,
    data: UpdateStudentData,
  ): Promise<IStudent> {
    const student = await Student.findOneAndUpdate(
      { _id: studentId, schoolId: schoolId },
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate("user", "email isActive")
      .populate("currentClass", "name section");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Update user record if name changed
    if (data.firstName || data.lastName) {
      await User.findByIdAndUpdate(student.userId, {
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
  async transferStudent(
    studentId: string,
    schoolId: string,
    newClassId: string,
  ): Promise<IStudent> {
    // Verify new class exists
    const newClass = await Class.findOne({
      _id: newClassId,
      school: schoolId,
      isActive: true,
    });

    if (!newClass) {
      throw new AppError("New class not found", 404);
    }

    const student = await Student.findOneAndUpdate(
      { _id: studentId, schoolId: schoolId },
      { $set: { classId: newClassId } },
      { new: true },
    )
      .populate("user", "email isActive")
      .populate("currentClass", "name section");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return student;
  }

  /**
   * Update student status
   */
  async updateStudentStatus(
    studentId: string,
    schoolId: string,
    status: StudentStatus,
  ): Promise<IStudent> {
    const student = await Student.findOneAndUpdate(
      { _id: studentId, schoolId: schoolId },
      { $set: { status } },
      { new: true },
    )
      .populate("user", "email isActive")
      .populate("currentClass", "name section");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // If student is graduated or transferred, deactivate user account
    if (
      status === StudentStatus.GRADUATED ||
      status === StudentStatus.TRANSFERRED
    ) {
      await User.findByIdAndUpdate(student.userId, { isActive: false });
    }

    return student;
  }

  /**
   * Bulk create students
   */
  async bulkCreateStudents(
    schoolId: string,
    classId: string,
    studentsData: BulkStudentData[],
  ): Promise<{
    created: number;
    failed: number;
    errors: { index: number; error: string }[];
  }> {
    const results = {
      created: 0,
      failed: 0,
      errors: [] as { index: number; error: string }[],
    };

    // Verify class exists
    const classDoc = await Class.findOne({
      _id: classId,
      school: schoolId,
      isActive: true,
    });

    if (!classDoc) {
      throw new AppError("Class not found", 404);
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
      } catch (error) {
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
  async deleteStudent(studentId: string, schoolId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findOne({
        _id: studentId,
        schoolId: schoolId,
      });

      if (!student) {
        throw new AppError("Student not found", 404);
      }

      // Deactivate user account
      await User.findByIdAndUpdate(
        student.userId,
        { isActive: false },
        { session },
      );

      // Update student status
      await Student.findByIdAndUpdate(
        studentId,
        { status: StudentStatus.TRANSFERRED },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStatistics(schoolId: string): Promise<{
    total: number;
    active: number;
    graduated: number;
    transferred: number;
    byClass: { classId: string; className: string; count: number }[];
  }> {
    const [statusCounts, byClass] = await Promise.all([
      Student.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Student.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(schoolId),
            status: StudentStatus.ACTIVE,
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
      if (item._id === StudentStatus.ACTIVE) stats.active = item.count;
      if (item._id === StudentStatus.GRADUATED) stats.graduated = item.count;
      if (item._id === StudentStatus.TRANSFERRED)
        stats.transferred = item.count;
    }

    return stats;
  }

  /**
   * Get student with fee status
   */
  async getStudentWithFeeStatus(
    studentId: string,
    termId: string,
    schoolId: string,
  ): Promise<{
    student: IStudent;
    feeStatus: { isPaid: boolean; amount?: number; paidAt?: Date };
  }> {
    const student = await this.getStudentById(studentId, schoolId);

    const feeStatus = await FeeStatus.findOne({
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

export const studentService = new StudentService();

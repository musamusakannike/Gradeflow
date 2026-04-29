import mongoose from "mongoose";
import { Student, User, Class, FeeStatus, School } from "../models";
import { AppError, ConflictError, NotFoundError } from "../utils/errors.util";
import { generateStudentId, generateSecurePassword } from "../utils/helpers.util";
import { sendParentCredentials, sendStudentCredentials } from "./email.service";
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
  classId?: string;
  status?: StudentStatus;
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
        schoolId: data.schoolId,
      });

      if (!classDoc) {
        throw new NotFoundError("Class not found");
      }

      const school = await School.findById(data.schoolId).select("code");
      if (!school) {
        throw new NotFoundError("School not found");
      }

      if (data.email) {
        const existingUser = await User.findOne({
          email: data.email.toLowerCase(),
        });
        if (existingUser) {
          throw new ConflictError("User with this email already exists");
        }
      }

      // Generate student ID
      const currentYear = new Date().getFullYear();
      const studentId = generateStudentId(school.code, currentYear);

      // Generate password for student account
      const password = generateSecurePassword();
      const loginEmail =
        data.email ||
        `${studentId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@student.gradeflow.local`;

      // Create user account for student
      const user = new User({
        email: loginEmail.toLowerCase(),
        password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phoneNumber,
        role: UserRole.STUDENT,
        schoolId: data.schoolId,
        status: "active",
        emailVerified: false,
      });

      await user.save({ session });

      // Create student record
      const student = new Student({
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
            loginEmail,
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
      .populate("user", "email status lastLogin firstName lastName phone")
      .populate("parentUser", "email status firstName lastName phone")
      .populate("class", "name section level");

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
      .populate("user", "email status lastLogin firstName lastName phone")
      .populate("parentUser", "email status firstName lastName phone")
      .populate("class", "name section level");

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

    if (search) {
      const matchingUsers = await User.find({
        schoolId,
        role: UserRole.STUDENT,
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
      Student.find(query)
        .populate("user", "email status firstName lastName")
        .populate("parentUser", "email status firstName lastName phone")
        .populate("class", "name section level")
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

  async getChildrenForParent(
    parentUserId: string,
    schoolId: string,
  ): Promise<IStudent[]> {
    return Student.find({
      parentUserId,
      schoolId,
      status: StudentStatus.ACTIVE,
    })
      .populate("user", "email status firstName lastName")
      .populate("class", "name section level")
      .sort({ createdAt: -1 });
  }

  async createParentAccount(
    studentId: string,
    schoolId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    } = {},
  ): Promise<{ parent: InstanceType<typeof User>; student: IStudent }> {
    const student = await Student.findOne({ _id: studentId, schoolId })
      .populate("user", "firstName lastName")
      .populate("class", "name section level");

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (student.parentUserId) {
      const parent = await User.findById(student.parentUserId);
      if (parent) {
        return { parent, student };
      }
    }

    const parentEmail = (data.email || student.parentEmail)?.toLowerCase();
    if (!parentEmail) {
      throw new AppError("Parent email is required", 400);
    }

    const existingUser = await User.findOne({ email: parentEmail, schoolId });
    if (existingUser && existingUser.role !== UserRole.PARENT) {
      throw new ConflictError("A non-parent user already uses this email");
    }

    let parent = existingUser;

    const temporaryPassword = generateSecurePassword();

    if (!parent) {
      const [fallbackFirstName, ...fallbackLastName] = student.parentName.split(" ");
      parent = await User.create({
        email: parentEmail,
        password: temporaryPassword,
        firstName: data.firstName || fallbackFirstName || "Parent",
        lastName: data.lastName || fallbackLastName.join(" ") || "Guardian",
        phone: data.phone || student.parentPhone,
        role: UserRole.PARENT,
        schoolId,
        status: "active",
        emailVerified: false,
      });

      const studentUser = student.userId as unknown as {
        firstName?: string;
        lastName?: string;
      };

      await sendParentCredentials(parentEmail, {
        studentName:
          `${studentUser?.firstName || ""} ${studentUser?.lastName || ""}`.trim() ||
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
  async getStudentsByClass(
    classId: string,
    schoolId: string,
  ): Promise<IStudent[]> {
    const students = await Student.find({
      classId,
      schoolId,
      status: StudentStatus.ACTIVE,
    })
      .populate("user", "email status firstName lastName")
      .sort({ studentId: 1 });

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
    if (data.classId) {
      const classDoc = await Class.findOne({ _id: data.classId, schoolId });
      if (!classDoc) {
        throw new NotFoundError("Class not found");
      }
    }

    if (data.email) {
      const existingUser = await User.findOne({
        email: data.email.toLowerCase(),
        schoolId,
      });
      if (existingUser) {
        const currentStudent = await Student.findOne({ _id: studentId, schoolId });
        if (!currentStudent || existingUser._id.toString() !== currentStudent.userId.toString()) {
          throw new ConflictError("User with this email already exists");
        }
      }
    }

    const studentUpdates: Record<string, unknown> = {
      ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
      ...(data.gender && { gender: data.gender }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.guardianName !== undefined && { parentName: data.guardianName }),
      ...(data.guardianEmail !== undefined && { parentEmail: data.guardianEmail }),
      ...(data.guardianPhone !== undefined && { parentPhone: data.guardianPhone }),
      ...(data.classId && { classId: data.classId }),
      ...(data.status && { status: data.status }),
    };

    const student = await Student.findOneAndUpdate(
      { _id: studentId, schoolId: schoolId },
      { $set: studentUpdates },
      { new: true, runValidators: true },
    )
      .populate("user", "email status firstName lastName phone")
      .populate("class", "name section level");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Update user record if name changed
    if (data.firstName || data.lastName || data.email || data.phoneNumber || data.status) {
      await User.findByIdAndUpdate(
        student.userId,
        {
          $set: {
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(data.email && { email: data.email.toLowerCase() }),
            ...(data.phoneNumber !== undefined && { phone: data.phoneNumber }),
            ...(data.status && {
              status:
                data.status === StudentStatus.ACTIVE ? "active" : "inactive",
            }),
          },
        },
        { runValidators: true },
      );
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
      schoolId,
    });

    if (!newClass) {
      throw new AppError("New class not found", 404);
    }

    const student = await Student.findOneAndUpdate(
      { _id: studentId, schoolId: schoolId },
      { $set: { classId: newClassId } },
      { new: true },
    )
      .populate("user", "email status firstName lastName")
      .populate("class", "name section level");

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
      .populate("user", "email status firstName lastName")
      .populate("class", "name section level");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // If student is graduated or transferred, deactivate user account
    if (
      status === StudentStatus.GRADUATED ||
      status === StudentStatus.TRANSFERRED
    ) {
      await User.findByIdAndUpdate(student.userId, { status: "inactive" });
    } else if (status === StudentStatus.ACTIVE) {
      await User.findByIdAndUpdate(student.userId, { status: "active" });
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
      schoolId,
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
        { status: "inactive" },
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

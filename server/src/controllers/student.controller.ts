import { Response, NextFunction } from "express";
import { studentService } from "../services/student.service";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest, StudentStatus } from "../types";
import { BadRequestError } from "../utils/errors.util";

class StudentController {
  /**
   * Create a new student
   * POST /api/v1/students
   */
  async createStudent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!.toString();
      const student = await studentService.createStudent({
        ...req.body,
        schoolId,
      });

      sendSuccess(res, student, "Student enrolled successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create students
   * POST /api/v1/students/bulk
   */
  async bulkCreateStudents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!.toString();
      const { classId, students } = req.body;

      const result = await studentService.bulkCreateStudents(
        schoolId,
        classId,
        students
      );

      sendSuccess(res, result, "Bulk enrollment completed");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all students for a school
   * GET /api/v1/students
   */
  async getStudents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!.toString();
      const { page, limit, status, classId, search } = req.query;

      const result = await studentService.getStudentsBySchool(schoolId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as StudentStatus,
        classId: classId as string,
        search: search as string,
      });

      sendSuccess(res, result, "Students retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student by ID
   * GET /api/v1/students/:id
   */
  async getStudentById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const schoolId = req.user!.schoolId!.toString();

      const student = await studentService.getStudentById(id, schoolId);
      sendSuccess(res, student, "Student retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update student
   * PATCH /api/v1/students/:id
   */
  async updateStudent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const schoolId = req.user!.schoolId!.toString();

      const student = await studentService.updateStudent(id, schoolId, req.body);
      sendSuccess(res, student, "Student updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer student to another class
   * POST /api/v1/students/:id/transfer
   */
  async transferStudent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const { classId } = req.body;
      const schoolId = req.user!.schoolId!.toString();

      if (!classId) {
        throw new BadRequestError("Target class ID is required");
      }

      const student = await studentService.transferStudent(id, schoolId, classId);
      sendSuccess(res, student, "Student transferred successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update student status
   * PATCH /api/v1/students/:id/status
   */
  async updateStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const schoolId = req.user!.schoolId!.toString();

      if (!status) {
        throw new BadRequestError("Status is required");
      }

      const student = await studentService.updateStudentStatus(id, schoolId, status as StudentStatus);
      sendSuccess(res, student, "Student status updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete student (soft delete)
   * DELETE /api/v1/students/:id
   */
  async deleteStudent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const schoolId = req.user!.schoolId!.toString();

      await studentService.deleteStudent(id, schoolId);
      sendSuccess(res, null, "Student deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student statistics
   * GET /api/v1/students/stats
   */
  async getStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!.toString();
      const stats = await studentService.getStudentStatistics(schoolId);
      sendSuccess(res, stats, "Student statistics retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getMyChildren(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!.toString();
      const children = await studentService.getChildrenForParent(
        req.user!._id.toString(),
        schoolId,
      );

      sendSuccess(res, children, "Children retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async createParentAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const schoolId = req.user!.schoolId!.toString();
      const result = await studentService.createParentAccount(
        id,
        schoolId,
        req.body,
      );

      sendSuccess(res, result, "Parent account linked successfully", 201);
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();

import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import * as resultService from "../services/result.service";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest, UserRole } from "../types";
import { BadRequestError } from "../utils/errors.util";

class ResultController {
  /**
   * Get student result for a term
   * GET /api/v1/results/student/:studentId
   */
  async getStudentResult(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const studentId = req.params.studentId as string;
      const { termId } = req.query;

      if (!termId) {
        throw new BadRequestError("Term ID is required");
      }

      // Check if student belongs to school and user has permission
      const checkFees = req.user!.role === UserRole.STUDENT;

      const result = await resultService.getStudentResult(
        new Types.ObjectId(studentId),
        new Types.ObjectId(termId as string),
        schoolId,
        checkFees
      );

      sendSuccess(res, result, "Result retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get class results (broadsheet)
   * GET /api/v1/results/class/:classId
   */
  async getClassResults(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const classId = req.params.classId as string;
      const { termId } = req.query;

      if (!termId) {
        throw new BadRequestError("Term ID is required");
      }

      const results = await resultService.getClassResults(
        new Types.ObjectId(classId),
        new Types.ObjectId(termId as string),
        schoolId
      );

      sendSuccess(res, results, "Class results retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const resultController = new ResultController();

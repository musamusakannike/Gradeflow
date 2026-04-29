import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import * as resultService from "../services/result.service";
import { Student } from "../models/student.model";
import { Class } from "../models/class.model";
import { ClassSubject } from "../models/class-subject.model";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest, UserRole } from "../types";
import { BadRequestError, ForbiddenError } from "../utils/errors.util";

class ResultController {
  async compileResult(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { classId, termId } = req.body;

      const batch = await resultService.compileResultBatch(
        new Types.ObjectId(classId as string),
        new Types.ObjectId(termId as string),
        schoolId,
        req.user!._id,
      );

      sendSuccess(res, batch, "Result compiled successfully");
    } catch (error) {
      next(error);
    }
  }

  async releaseResult(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { classId, termId } = req.body;

      const batch = await resultService.releaseResultBatch(
        new Types.ObjectId(classId as string),
        new Types.ObjectId(termId as string),
        schoolId,
        req.user!._id,
      );

      sendSuccess(res, batch, "Result released successfully");
    } catch (error) {
      next(error);
    }
  }

  async unreleaseResult(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { classId, termId } = req.body;

      const batch = await resultService.unreleaseResultBatch(
        new Types.ObjectId(classId as string),
        new Types.ObjectId(termId as string),
        schoolId,
        req.user!._id,
      );

      sendSuccess(res, batch, "Result unreleased successfully");
    } catch (error) {
      next(error);
    }
  }

  async getResultStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { classId, termId } = req.query;

      const batch = await resultService.getResultBatchStatus(
        new Types.ObjectId(classId as string),
        new Types.ObjectId(termId as string),
        schoolId,
      );

      sendSuccess(res, batch, "Result status retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

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

      if (req.user!.role === UserRole.STUDENT) {
        const student = await Student.findOne({
          _id: studentId,
          schoolId,
          userId: req.user!._id,
        }).select("_id");

        if (!student) {
          throw new ForbiddenError("Cannot access another student's result");
        }
      }

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

      if (req.user!.role === UserRole.TEACHER) {
        const [classDoc, assignedSubject] = await Promise.all([
          Class.findOne({
            _id: classId,
            schoolId,
            classTeacherId: req.user!._id,
          }).select("_id"),
          ClassSubject.findOne({
            classId,
            schoolId,
            teacherId: req.user!._id,
          }).select("_id"),
        ]);

        if (!classDoc && !assignedSubject) {
          throw new ForbiddenError("Cannot view results for this class");
        }
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

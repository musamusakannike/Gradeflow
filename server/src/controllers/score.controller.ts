import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import * as resultService from "../services/result.service";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";
import { BadRequestError } from "../utils/errors.util";

class ScoreController {
  /**
   * Enter or update a single score
   * POST /api/v1/scores
   */
  async enterScore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { studentId, classSubjectId, termId, ...scoreData } = req.body;

      const score = await resultService.enterScores(
        {
          studentId: new Types.ObjectId(studentId as string),
          classSubjectId: new Types.ObjectId(classSubjectId as string),
          termId: new Types.ObjectId(termId as string),
          ...scoreData,
        },
        schoolId
      );

      sendSuccess(res, score, "Score recorded successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk enter scores for a class subject
   * POST /api/v1/scores/bulk
   */
  async bulkEnterScores(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { classSubjectId, termId, scores } = req.body;

      const formattedScores = scores.map((s: any) => ({
        ...s,
        studentId: new Types.ObjectId(s.studentId as string),
      }));

      const result = await resultService.bulkEnterScores(
        new Types.ObjectId(classSubjectId as string),
        new Types.ObjectId(termId as string),
        formattedScores,
        schoolId
      );

      sendSuccess(res, result, "Bulk score entry completed");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subject results for a class
   * GET /api/v1/scores/subject/:classSubjectId
   */
  async getSubjectScores(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const classSubjectId = req.params.classSubjectId as string;
      const { termId } = req.query;

      if (!termId) {
        throw new BadRequestError("Term ID is required");
      }

      const result = await resultService.getSubjectResults(
        new Types.ObjectId(classSubjectId),
        new Types.ObjectId(termId as string),
        schoolId
      );

      sendSuccess(res, result, "Subject scores retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const scoreController = new ScoreController();

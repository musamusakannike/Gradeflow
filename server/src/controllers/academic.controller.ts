import { Response, NextFunction } from "express";
import { Session } from "../models/session.model";
import { Term } from "../models/term.model";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";
import { NotFoundError, BadRequestError } from "../utils/errors.util";

/**
 * Academic Controller
 * Handles Session and Term management
 */
class AcademicController {
  // --- SESSION METHODS ---

  /**
   * Create a new academic session
   * POST /api/v1/sessions
   */
  async createSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { startYear, isCurrent } = req.body;
      const schoolId = req.user!.schoolId;

      const session = await Session.create({
        schoolId,
        startYear,
        isCurrent,
      });

      // Automatically create 3 terms for this session
      const currentYear = new Date().getFullYear();
      const termsData = [
        {
          schoolId,
          sessionId: session._id,
          termNumber: 1,
          name: "First Term",
          startDate: new Date(startYear, 8, 1), // Sept 1st
          endDate: new Date(startYear, 11, 15), // Dec 15th
          isCurrent: isCurrent, // Set 1st term as current if session is current
        },
        {
          schoolId,
          sessionId: session._id,
          termNumber: 2,
          name: "Second Term",
          startDate: new Date(startYear + 1, 0, 10), // Jan 10th
          endDate: new Date(startYear + 1, 3, 10), // April 10th
          isCurrent: false,
        },
        {
          schoolId,
          sessionId: session._id,
          termNumber: 3,
          name: "Third Term",
          startDate: new Date(startYear + 1, 4, 1), // May 1st
          endDate: new Date(startYear + 1, 6, 25), // July 25th
          isCurrent: false,
        },
      ];

      await Term.insertMany(termsData);

      sendSuccess(res, session, "Academic session and terms created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all sessions for a school
   * GET /api/v1/sessions
   */
  async getSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const sessions = await Session.find({ schoolId }).sort({ startYear: -1 }).populate("terms");
      sendSuccess(res, sessions, "Sessions retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set a session as current
   * PATCH /api/v1/sessions/:id/current
   */
  async setCurrentSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const session = await Session.findOne({ _id: id, schoolId });
      if (!session) {
        throw new NotFoundError("Session not found");
      }

      session.isCurrent = true;
      await session.save();

      sendSuccess(res, session, "Current session updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // --- TERM METHODS ---

  /**
   * Get all terms for a session
   * GET /api/v1/terms?sessionId=...
   */
  async getTerms(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const { sessionId } = req.query;

      const query: any = { schoolId };
      if (sessionId) query.sessionId = sessionId;

      const terms = await Term.find(query).sort({ termNumber: 1 });
      sendSuccess(res, terms, "Terms retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a term
   * PATCH /api/v1/terms/:id
   */
  async updateTerm(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const term = await Term.findOneAndUpdate(
        { _id: id, schoolId },
        req.body,
        { new: true, runValidators: true },
      );

      if (!term) {
        throw new NotFoundError("Term not found");
      }

      sendSuccess(res, term, "Term updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set a term as current
   * PATCH /api/v1/terms/:id/current
   */
  async setCurrentTerm(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const term = await Term.findOne({ _id: id, schoolId });
      if (!term) {
        throw new NotFoundError("Term not found");
      }

      term.isCurrent = true;
      await term.save();

      sendSuccess(res, term, "Current term updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const academicController = new AcademicController();

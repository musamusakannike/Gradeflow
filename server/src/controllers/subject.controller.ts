import { Response, NextFunction } from "express";
import { Subject } from "../models/subject.model";
import { ClassSubject } from "../models/class-subject.model";
import { Class } from "../models/class.model";
import { User } from "../models/user.model";
import { Session } from "../models/session.model";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest, UserRole } from "../types";
import { NotFoundError, ConflictError } from "../utils/errors.util";

class SubjectController {
  /**
   * Create a new subject
   * POST /api/v1/subjects
   */
  async createSubject(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      
      // Check if code already exists for this school
      if (req.body.code) {
        const existing = await Subject.findOne({ 
          schoolId, 
          code: req.body.code.toUpperCase() 
        });
        if (existing) {
          throw new ConflictError("Subject code already exists");
        }
      }

      const subject = await Subject.create({
        ...req.body,
        schoolId,
      });

      sendSuccess(res, subject, "Subject created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all subjects for a school
   * GET /api/v1/subjects
   */
  async getSubjects(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const subjects = await Subject.find({ schoolId }).sort({ name: 1 });
      sendSuccess(res, subjects, "Subjects retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subject by ID
   * GET /api/v1/subjects/:id
   */
  async getSubjectById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const subject = await Subject.findOne({ _id: id, schoolId });
      if (!subject) {
        throw new NotFoundError("Subject not found");
      }

      sendSuccess(res, subject, "Subject retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a subject
   * PATCH /api/v1/subjects/:id
   */
  async updateSubject(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const subject = await Subject.findOneAndUpdate(
        { _id: id, schoolId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!subject) {
        throw new NotFoundError("Subject not found");
      }

      sendSuccess(res, subject, "Subject updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign subject to class and teacher
   * POST /api/v1/subjects/assign
   */
  async assignToClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const { classId, subjectId, teacherId, sessionId } = req.body;

      const [classDoc, subject, teacher, session] = await Promise.all([
        Class.findOne({ _id: classId, schoolId }),
        Subject.findOne({ _id: subjectId, schoolId, isActive: true }),
        User.findOne({
          _id: teacherId,
          schoolId,
          role: UserRole.TEACHER,
          status: "active",
        }),
        Session.findOne({ _id: sessionId, schoolId }),
      ]);

      if (!classDoc) {
        throw new NotFoundError("Class not found");
      }

      if (!subject) {
        throw new NotFoundError("Active subject not found");
      }

      if (!teacher) {
        throw new NotFoundError("Active teacher not found for this school");
      }

      if (!session) {
        throw new NotFoundError("Session not found");
      }

      // Check for existing assignment
      const existing = await ClassSubject.findOne({
        schoolId,
        classId,
        subjectId,
        sessionId
      });

      if (existing) {
        throw new ConflictError("Subject is already assigned to this class for the given session");
      }

      const assignment = await ClassSubject.create({
        schoolId,
        classId,
        subjectId,
        teacherId,
        sessionId
      });

      sendSuccess(res, assignment, "Subject assigned to class successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assignments for a class
   * GET /api/v1/subjects/assignments/:classId
   */
  async getClassAssignments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const { classId } = req.params;
      const { sessionId } = req.query;

      const query: any = { schoolId, classId };
      if (sessionId) query.sessionId = sessionId;

      const assignments = await ClassSubject.find(query)
        .populate("subjectId", "name code")
        .populate("teacherId", "firstName lastName")
        .populate("sessionId", "name");

      sendSuccess(res, assignments, "Class assignments retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get all assignments for a school
   * GET /api/v1/subjects/assignments
   */
  async getAllAssignments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;

      const assignments = await ClassSubject.find({ schoolId })
        .populate("subjectId", "name code")
        .populate("teacherId", "firstName lastName")
        .populate("classId", "name level section")
        .populate("sessionId", "name");

      sendSuccess(res, assignments, "Assignments retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an assignment
   * DELETE /api/v1/subjects/assignments/:id
   */
  async deleteAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const assignment = await ClassSubject.findOneAndDelete({
        _id: id,
        schoolId,
      });

      if (!assignment) {
        throw new NotFoundError("Assignment not found");
      }

      sendSuccess(res, null, "Assignment deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update assignment (e.g., change teacher)
   * PATCH /api/v1/subjects/assignments/:id
   */
  async updateAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;
      const teacher = await User.findOne({
        _id: req.body.teacherId,
        schoolId,
        role: UserRole.TEACHER,
        status: "active",
      });

      if (!teacher) {
        throw new NotFoundError("Active teacher not found for this school");
      }
      
      const assignment = await ClassSubject.findOneAndUpdate(
        { _id: id, schoolId },
        { teacherId: req.body.teacherId },
        { new: true }
      );
      
      if (!assignment) {
        throw new NotFoundError("Assignment not found");
      }
      
      sendSuccess(res, assignment, "Assignment updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const subjectController = new SubjectController();

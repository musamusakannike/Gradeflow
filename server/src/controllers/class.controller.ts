import { Response, NextFunction } from "express";
import { Class } from "../models/class.model";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";
import { NotFoundError } from "../utils/errors.util";

class ClassController {
  /**
   * Create a new class
   * POST /api/v1/classes
   */
  async createClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const classDoc = await Class.create({
        ...req.body,
        schoolId,
      });

      sendSuccess(res, classDoc, "Class created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all classes for a school
   * GET /api/v1/classes
   */
  async getClasses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId;
      const classes = await Class.find({ schoolId })
        .populate("classTeacher", "firstName lastName")
        .populate("studentsCount")
        .sort({ level: 1, name: 1 });

      sendSuccess(res, classes, "Classes retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single class
   * GET /api/v1/classes/:id
   */
  async getClassById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const classDoc = await Class.findOne({ _id: id, schoolId })
        .populate("classTeacher", "firstName lastName")
        .populate("studentsCount")
        .populate({
          path: "subjects",
          populate: [
            { path: "subjectId", select: "name code" },
            { path: "teacherId", select: "firstName lastName" }
          ]
        });

      if (!classDoc) {
        throw new NotFoundError("Class not found");
      }

      sendSuccess(res, classDoc, "Class retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a class
   * PATCH /api/v1/classes/:id
   */
  async updateClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const classDoc = await Class.findOneAndUpdate(
        { _id: id, schoolId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!classDoc) {
        throw new NotFoundError("Class not found");
      }

      sendSuccess(res, classDoc, "Class updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a class
   * DELETE /api/v1/classes/:id
   */
  async deleteClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId;

      const classDoc = await Class.findOneAndDelete({ _id: id, schoolId });

      if (!classDoc) {
        throw new NotFoundError("Class not found");
      }

      sendSuccess(res, null, "Class deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const classController = new ClassController();

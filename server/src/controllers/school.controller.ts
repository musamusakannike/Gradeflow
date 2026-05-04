import { Response, NextFunction } from "express";
import { School } from "../models/school.model";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";
import { NotFoundError } from "../utils/errors.util";

class SchoolController {
  async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const school = await School.findById(req.user!.schoolId);
      if (!school) {
        throw new NotFoundError("School not found");
      }

      sendSuccess(res, school, "School profile retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const school = await School.findById(req.user!.schoolId);
      if (!school) {
        throw new NotFoundError("School not found");
      }

      const { settings, ...profile } = req.body;
      Object.assign(school, profile);

      if (settings) {
        school.settings = {
          ...school.settings,
          ...settings,
        };
      }

      await school.save();
      sendSuccess(res, school, "School profile updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const schoolController = new SchoolController();

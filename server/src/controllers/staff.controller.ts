import { Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { createStaffUser } from "../services/auth.service";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest, UserRole } from "../types";
import { NotFoundError, BadRequestError } from "../utils/errors.util";

class StaffController {
  /**
   * Create a new staff member
   * POST /api/v1/staff
   */
  async createStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!;
      const createdBy = req.user!._id;

      const staff = await createStaffUser(
        req.body,
        schoolId,
        createdBy
      );

      sendSuccess(res, staff, "Staff member created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all staff for a school
   * GET /api/v1/staff
   */
  async getStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId!;
      const { role } = req.query;

      const query: any = { 
        schoolId, 
        role: { $in: [UserRole.TEACHER, UserRole.BURSAR, UserRole.SCHOOL_ADMIN] } 
      };

      if (role && Object.values(UserRole).includes(role as UserRole)) {
        query.role = role;
      }

      const staff = await User.find(query)
        .select("-password")
        .sort({ firstName: 1, lastName: 1 });

      sendSuccess(res, staff, "Staff members retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff member by ID
   * GET /api/v1/staff/:id
   */
  async getStaffById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      const staff = await User.findOne({ 
        _id: id, 
        schoolId,
        role: { $ne: UserRole.STUDENT }
      }).select("-password");

      if (!staff) {
        throw new NotFoundError("Staff member not found");
      }

      sendSuccess(res, staff, "Staff member retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff member
   * PATCH /api/v1/staff/:id
   */
  async updateStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      const staff = await User.findOneAndUpdate(
        { 
          _id: id, 
          schoolId,
          role: { $ne: UserRole.STUDENT }
        },
        req.body,
        { new: true, runValidators: true }
      ).select("-password");

      if (!staff) {
        throw new NotFoundError("Staff member not found");
      }

      sendSuccess(res, staff, "Staff member updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete (deactivate) staff member
   * DELETE /api/v1/staff/:id
   */
  async deleteStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;

      const staff = await User.findOneAndUpdate(
        { 
          _id: id, 
          schoolId,
          role: { $ne: UserRole.STUDENT }
        },
        { status: "inactive" },
        { new: true }
      );

      if (!staff) {
        throw new NotFoundError("Staff member not found");
      }

      sendSuccess(res, null, "Staff member deactivated successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();

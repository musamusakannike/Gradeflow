import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AuthenticatedRequest, UserRole } from "../types/index";
import { School } from "../models/school.model";
import { NotFoundError, ForbiddenError } from "../utils/errors.util";

/**
 * Set school context from params or user's school
 */
export const setSchoolContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let schoolId: string | undefined;

    // Priority: params > body > query > user's school
    if (req.params.schoolId) {
      schoolId = req.params.schoolId as string;
    } else if (req.body.schoolId) {
      schoolId = req.body.schoolId as string;
    } else if (req.query.schoolId) {
      schoolId = req.query.schoolId as string;
    } else if (req.user?.schoolId) {
      schoolId = req.user.schoolId.toString();
    }

    if (schoolId) {
      // Validate ObjectId
      if (!Types.ObjectId.isValid(schoolId)) {
        throw new NotFoundError("Invalid school ID", "INVALID_SCHOOL_ID");
      }

      // Super admin can access any school
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        // Verify user belongs to this school
        if (req.user?.schoolId?.toString() !== schoolId) {
          throw new ForbiddenError(
            "Cannot access this school",
            "SCHOOL_ACCESS_DENIED",
          );
        }
      }

      // Verify school exists
      const school = await School.findById(schoolId).select("_id isActive");

      if (!school) {
        throw new NotFoundError("School not found", "SCHOOL_NOT_FOUND");
      }

      if (!school.isActive && req.user?.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenError("School is inactive", "SCHOOL_INACTIVE");
      }

      req.schoolId = new Types.ObjectId(schoolId);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require school context to be set
 */
export const requireSchoolContext = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.schoolId && req.user?.role !== UserRole.SUPER_ADMIN) {
    next(new ForbiddenError("School context required", "NO_SCHOOL_CONTEXT"));
    return;
  }
  next();
};

/**
 * Inject school ID into request body if not present
 */
export const injectSchoolId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.schoolId && !req.body.schoolId) {
    req.body.schoolId = req.schoolId;
  }
  next();
};

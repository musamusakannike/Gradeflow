import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  AuthenticatedRequest,
  AuthUser,
  JWTPayload,
  UserRole,
} from "../types/index";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.util";
import { User } from "../models/user.model";
import { Types } from "mongoose";

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided", "NO_TOKEN");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError(
        "Invalid token format",
        "INVALID_TOKEN_FORMAT",
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    if (decoded.type !== "access") {
      throw new UnauthorizedError("Invalid token type", "INVALID_TOKEN_TYPE");
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select(
      "_id email role schoolId status",
    );

    if (!user) {
      throw new UnauthorizedError("User not found", "USER_NOT_FOUND");
    }

    if (user.status !== "active") {
      throw new UnauthorizedError("Account is not active", "ACCOUNT_INACTIVE");
    }

    req.user = {
      _id: user._id as Types.ObjectId,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId as Types.ObjectId | undefined,
    };

    // Set school context for multi-tenancy
    if (user.schoolId) {
      req.schoolId = user.schoolId as Types.ObjectId;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token", "INVALID_TOKEN"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired", "TOKEN_EXPIRED"));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    if (decoded.type !== "access") {
      return next();
    }

    const user = await User.findById(decoded.userId).select(
      "_id email role schoolId status",
    );

    if (user && user.status === "active") {
      req.user = {
        _id: user._id as Types.ObjectId,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId as Types.ObjectId | undefined,
      };

      if (user.schoolId) {
        req.schoolId = user.schoolId as Types.ObjectId;
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
};

/**
 * Require specific roles
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          "Insufficient permissions",
          "INSUFFICIENT_PERMISSIONS",
        ),
      );
      return;
    }

    next();
  };
};

/**
 * Require super admin role
 */
export const requireSuperAdmin = requireRoles(UserRole.SUPER_ADMIN);

/**
 * Require school admin or higher
 */
export const requireSchoolAdmin = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
);

/**
 * Require teacher or higher
 */
export const requireTeacher = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
);

/**
 * Require bursar role
 */
export const requireBursar = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.BURSAR,
);

/**
 * Require staff (any non-student role)
 */
export const requireStaff = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
  UserRole.BURSAR,
);

/**
 * Ensure user belongs to the specified school
 */
export const requireSchoolAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new UnauthorizedError("Authentication required", "AUTH_REQUIRED"));
    return;
  }

  // Super admin can access any school
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  const schoolId =
    req.params.schoolId || req.body.schoolId || req.query.schoolId;

  if (!req.user.schoolId) {
    next(new ForbiddenError("No school access", "NO_SCHOOL_ACCESS"));
    return;
  }

  if (schoolId && req.user.schoolId.toString() !== schoolId) {
    next(
      new ForbiddenError("Cannot access this school", "SCHOOL_ACCESS_DENIED"),
    );
    return;
  }

  next();
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSchoolAccess = exports.requireStaff = exports.requireBursar = exports.requireTeacher = exports.requireSchoolAdmin = exports.requireSuperAdmin = exports.authorize = exports.requireRoles = exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../types/index");
const errors_util_1 = require("../utils/errors.util");
const user_model_1 = require("../models/user.model");
/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new errors_util_1.UnauthorizedError("No token provided", "NO_TOKEN");
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new errors_util_1.UnauthorizedError("Invalid token format", "INVALID_TOKEN_FORMAT");
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured");
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded.type !== "access") {
            throw new errors_util_1.UnauthorizedError("Invalid token type", "INVALID_TOKEN_TYPE");
        }
        // Verify user still exists and is active
        const user = await user_model_1.User.findById(decoded.userId).select("_id email role schoolId status");
        if (!user) {
            throw new errors_util_1.UnauthorizedError("User not found", "USER_NOT_FOUND");
        }
        if (user.status !== "active") {
            throw new errors_util_1.UnauthorizedError("Account is not active", "ACCOUNT_INACTIVE");
        }
        req.user = {
            _id: user._id,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
        };
        // Set school context for multi-tenancy
        if (user.schoolId) {
            req.schoolId = user.schoolId;
        }
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_util_1.UnauthorizedError("Invalid token", "INVALID_TOKEN"));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errors_util_1.UnauthorizedError("Token expired", "TOKEN_EXPIRED"));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded.type !== "access") {
            return next();
        }
        const user = await user_model_1.User.findById(decoded.userId).select("_id email role schoolId status");
        if (user && user.status === "active") {
            req.user = {
                _id: user._id,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            };
            if (user.schoolId) {
                req.schoolId = user.schoolId;
            }
        }
        next();
    }
    catch {
        // Silently continue without auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Require specific roles
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            next(new errors_util_1.UnauthorizedError("Authentication required", "AUTH_REQUIRED"));
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            next(new errors_util_1.ForbiddenError("Insufficient permissions", "INSUFFICIENT_PERMISSIONS"));
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Alias for requireRoles
 */
exports.authorize = exports.requireRoles;
/**
 * Require super admin role
 */
exports.requireSuperAdmin = (0, exports.requireRoles)(index_1.UserRole.SUPER_ADMIN);
/**
 * Require school admin or higher
 */
exports.requireSchoolAdmin = (0, exports.requireRoles)(index_1.UserRole.SUPER_ADMIN, index_1.UserRole.SCHOOL_ADMIN);
/**
 * Require teacher or higher
 */
exports.requireTeacher = (0, exports.requireRoles)(index_1.UserRole.SUPER_ADMIN, index_1.UserRole.SCHOOL_ADMIN, index_1.UserRole.TEACHER);
/**
 * Require bursar role
 */
exports.requireBursar = (0, exports.requireRoles)(index_1.UserRole.SUPER_ADMIN, index_1.UserRole.SCHOOL_ADMIN, index_1.UserRole.BURSAR);
/**
 * Require staff (any non-student role)
 */
exports.requireStaff = (0, exports.requireRoles)(index_1.UserRole.SUPER_ADMIN, index_1.UserRole.SCHOOL_ADMIN, index_1.UserRole.TEACHER, index_1.UserRole.BURSAR);
/**
 * Ensure user belongs to the specified school
 */
const requireSchoolAccess = (req, res, next) => {
    if (!req.user) {
        next(new errors_util_1.UnauthorizedError("Authentication required", "AUTH_REQUIRED"));
        return;
    }
    // Super admin can access any school
    if (req.user.role === index_1.UserRole.SUPER_ADMIN) {
        next();
        return;
    }
    const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
    if (!req.user.schoolId) {
        next(new errors_util_1.ForbiddenError("No school access", "NO_SCHOOL_ACCESS"));
        return;
    }
    if (schoolId && req.user.schoolId.toString() !== schoolId) {
        next(new errors_util_1.ForbiddenError("Cannot access this school", "SCHOOL_ACCESS_DENIED"));
        return;
    }
    next();
};
exports.requireSchoolAccess = requireSchoolAccess;
//# sourceMappingURL=auth.middleware.js.map
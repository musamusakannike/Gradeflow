"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectSchoolId = exports.requireSchoolContext = exports.setSchoolContext = void 0;
const mongoose_1 = require("mongoose");
const index_1 = require("../types/index");
const school_model_1 = require("../models/school.model");
const errors_util_1 = require("../utils/errors.util");
/**
 * Set school context from params or user's school
 */
const setSchoolContext = async (req, res, next) => {
    try {
        let schoolId;
        // Priority: params > body > query > user's school
        if (req.params.schoolId) {
            schoolId = req.params.schoolId;
        }
        else if (req.body.schoolId) {
            schoolId = req.body.schoolId;
        }
        else if (req.query.schoolId) {
            schoolId = req.query.schoolId;
        }
        else if (req.user?.schoolId) {
            schoolId = req.user.schoolId.toString();
        }
        if (schoolId) {
            // Validate ObjectId
            if (!mongoose_1.Types.ObjectId.isValid(schoolId)) {
                throw new errors_util_1.NotFoundError("Invalid school ID", "INVALID_SCHOOL_ID");
            }
            // Super admin can access any school
            if (req.user?.role !== index_1.UserRole.SUPER_ADMIN) {
                // Verify user belongs to this school
                if (req.user?.schoolId?.toString() !== schoolId) {
                    throw new errors_util_1.ForbiddenError("Cannot access this school", "SCHOOL_ACCESS_DENIED");
                }
            }
            // Verify school exists
            const school = await school_model_1.School.findById(schoolId).select("_id isActive");
            if (!school) {
                throw new errors_util_1.NotFoundError("School not found", "SCHOOL_NOT_FOUND");
            }
            if (!school.isActive && req.user?.role !== index_1.UserRole.SUPER_ADMIN) {
                throw new errors_util_1.ForbiddenError("School is inactive", "SCHOOL_INACTIVE");
            }
            req.schoolId = new mongoose_1.Types.ObjectId(schoolId);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.setSchoolContext = setSchoolContext;
/**
 * Require school context to be set
 */
const requireSchoolContext = (req, res, next) => {
    if (!req.schoolId && req.user?.role !== index_1.UserRole.SUPER_ADMIN) {
        next(new errors_util_1.ForbiddenError("School context required", "NO_SCHOOL_CONTEXT"));
        return;
    }
    next();
};
exports.requireSchoolContext = requireSchoolContext;
/**
 * Inject school ID into request body if not present
 */
const injectSchoolId = (req, res, next) => {
    if (req.schoolId && !req.body.schoolId) {
        req.body.schoolId = req.schoolId;
    }
    next();
};
exports.injectSchoolId = injectSchoolId;
//# sourceMappingURL=school.middleware.js.map
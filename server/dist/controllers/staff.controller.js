"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffController = void 0;
const user_model_1 = require("../models/user.model");
const auth_service_1 = require("../services/auth.service");
const response_util_1 = require("../utils/response.util");
const types_1 = require("../types");
const errors_util_1 = require("../utils/errors.util");
class StaffController {
    /**
     * Create a new staff member
     * POST /api/v1/staff
     */
    async createStaff(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const createdBy = req.user._id;
            const staff = await (0, auth_service_1.createStaffUser)(req.body, schoolId, createdBy);
            (0, response_util_1.sendSuccess)(res, staff, "Staff member created successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all staff for a school
     * GET /api/v1/staff
     */
    async getStaff(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { role } = req.query;
            const query = {
                schoolId,
                role: { $in: [types_1.UserRole.TEACHER, types_1.UserRole.BURSAR, types_1.UserRole.SCHOOL_ADMIN] }
            };
            if (role && Object.values(types_1.UserRole).includes(role)) {
                query.role = role;
            }
            const staff = await user_model_1.User.find(query)
                .select("-password")
                .sort({ firstName: 1, lastName: 1 });
            (0, response_util_1.sendSuccess)(res, staff, "Staff members retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get staff member by ID
     * GET /api/v1/staff/:id
     */
    async getStaffById(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const staff = await user_model_1.User.findOne({
                _id: id,
                schoolId,
                role: { $ne: types_1.UserRole.STUDENT }
            }).select("-password");
            if (!staff) {
                throw new errors_util_1.NotFoundError("Staff member not found");
            }
            (0, response_util_1.sendSuccess)(res, staff, "Staff member retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update staff member
     * PATCH /api/v1/staff/:id
     */
    async updateStaff(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const staff = await user_model_1.User.findOneAndUpdate({
                _id: id,
                schoolId,
                role: { $ne: types_1.UserRole.STUDENT }
            }, req.body, { new: true, runValidators: true }).select("-password");
            if (!staff) {
                throw new errors_util_1.NotFoundError("Staff member not found");
            }
            (0, response_util_1.sendSuccess)(res, staff, "Staff member updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete (deactivate) staff member
     * DELETE /api/v1/staff/:id
     */
    async deleteStaff(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const staff = await user_model_1.User.findOneAndUpdate({
                _id: id,
                schoolId,
                role: { $ne: types_1.UserRole.STUDENT }
            }, { status: "inactive" }, { new: true });
            if (!staff) {
                throw new errors_util_1.NotFoundError("Staff member not found");
            }
            (0, response_util_1.sendSuccess)(res, null, "Staff member deactivated successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.staffController = new StaffController();
//# sourceMappingURL=staff.controller.js.map
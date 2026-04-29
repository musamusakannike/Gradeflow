"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolController = void 0;
const school_model_1 = require("../models/school.model");
const response_util_1 = require("../utils/response.util");
const errors_util_1 = require("../utils/errors.util");
class SchoolController {
    async getProfile(req, res, next) {
        try {
            const school = await school_model_1.School.findById(req.user.schoolId);
            if (!school) {
                throw new errors_util_1.NotFoundError("School not found");
            }
            (0, response_util_1.sendSuccess)(res, school, "School profile retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const school = await school_model_1.School.findById(req.user.schoolId);
            if (!school) {
                throw new errors_util_1.NotFoundError("School not found");
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
            (0, response_util_1.sendSuccess)(res, school, "School profile updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.schoolController = new SchoolController();
//# sourceMappingURL=school.controller.js.map
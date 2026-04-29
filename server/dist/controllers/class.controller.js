"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classController = void 0;
const class_model_1 = require("../models/class.model");
const response_util_1 = require("../utils/response.util");
const errors_util_1 = require("../utils/errors.util");
class ClassController {
    /**
     * Create a new class
     * POST /api/v1/classes
     */
    async createClass(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const classDoc = await class_model_1.Class.create({
                ...req.body,
                schoolId,
            });
            (0, response_util_1.sendSuccess)(res, classDoc, "Class created successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all classes for a school
     * GET /api/v1/classes
     */
    async getClasses(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const classes = await class_model_1.Class.find({ schoolId })
                .populate("classTeacher", "firstName lastName")
                .populate("studentsCount")
                .sort({ level: 1, name: 1 });
            (0, response_util_1.sendSuccess)(res, classes, "Classes retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get a single class
     * GET /api/v1/classes/:id
     */
    async getClassById(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const classDoc = await class_model_1.Class.findOne({ _id: id, schoolId })
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
                throw new errors_util_1.NotFoundError("Class not found");
            }
            (0, response_util_1.sendSuccess)(res, classDoc, "Class retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a class
     * PATCH /api/v1/classes/:id
     */
    async updateClass(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const classDoc = await class_model_1.Class.findOneAndUpdate({ _id: id, schoolId }, req.body, { new: true, runValidators: true });
            if (!classDoc) {
                throw new errors_util_1.NotFoundError("Class not found");
            }
            (0, response_util_1.sendSuccess)(res, classDoc, "Class updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a class
     * DELETE /api/v1/classes/:id
     */
    async deleteClass(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const classDoc = await class_model_1.Class.findOneAndDelete({ _id: id, schoolId });
            if (!classDoc) {
                throw new errors_util_1.NotFoundError("Class not found");
            }
            (0, response_util_1.sendSuccess)(res, null, "Class deleted successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.classController = new ClassController();
//# sourceMappingURL=class.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentController = void 0;
const student_service_1 = require("../services/student.service");
const response_util_1 = require("../utils/response.util");
const errors_util_1 = require("../utils/errors.util");
class StudentController {
    /**
     * Create a new student
     * POST /api/v1/students
     */
    async createStudent(req, res, next) {
        try {
            const schoolId = req.user.schoolId.toString();
            const student = await student_service_1.studentService.createStudent({
                ...req.body,
                schoolId,
            });
            (0, response_util_1.sendSuccess)(res, student, "Student enrolled successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk create students
     * POST /api/v1/students/bulk
     */
    async bulkCreateStudents(req, res, next) {
        try {
            const schoolId = req.user.schoolId.toString();
            const { classId, students } = req.body;
            const result = await student_service_1.studentService.bulkCreateStudents(schoolId, classId, students);
            (0, response_util_1.sendSuccess)(res, result, "Bulk enrollment completed");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all students for a school
     * GET /api/v1/students
     */
    async getStudents(req, res, next) {
        try {
            const schoolId = req.user.schoolId.toString();
            const { page, limit, status, classId, search } = req.query;
            const result = await student_service_1.studentService.getStudentsBySchool(schoolId, {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status: status,
                classId: classId,
                search: search,
            });
            (0, response_util_1.sendSuccess)(res, result, "Students retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get student by ID
     * GET /api/v1/students/:id
     */
    async getStudentById(req, res, next) {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId.toString();
            const student = await student_service_1.studentService.getStudentById(id, schoolId);
            (0, response_util_1.sendSuccess)(res, student, "Student retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update student
     * PATCH /api/v1/students/:id
     */
    async updateStudent(req, res, next) {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId.toString();
            const student = await student_service_1.studentService.updateStudent(id, schoolId, req.body);
            (0, response_util_1.sendSuccess)(res, student, "Student updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Transfer student to another class
     * POST /api/v1/students/:id/transfer
     */
    async transferStudent(req, res, next) {
        try {
            const id = req.params.id;
            const { classId } = req.body;
            const schoolId = req.user.schoolId.toString();
            if (!classId) {
                throw new errors_util_1.BadRequestError("Target class ID is required");
            }
            const student = await student_service_1.studentService.transferStudent(id, schoolId, classId);
            (0, response_util_1.sendSuccess)(res, student, "Student transferred successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update student status
     * PATCH /api/v1/students/:id/status
     */
    async updateStatus(req, res, next) {
        try {
            const id = req.params.id;
            const { status } = req.body;
            const schoolId = req.user.schoolId.toString();
            if (!status) {
                throw new errors_util_1.BadRequestError("Status is required");
            }
            const student = await student_service_1.studentService.updateStudentStatus(id, schoolId, status);
            (0, response_util_1.sendSuccess)(res, student, "Student status updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete student (soft delete)
     * DELETE /api/v1/students/:id
     */
    async deleteStudent(req, res, next) {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId.toString();
            await student_service_1.studentService.deleteStudent(id, schoolId);
            (0, response_util_1.sendSuccess)(res, null, "Student deleted successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get student statistics
     * GET /api/v1/students/stats
     */
    async getStats(req, res, next) {
        try {
            const schoolId = req.user.schoolId.toString();
            const stats = await student_service_1.studentService.getStudentStatistics(schoolId);
            (0, response_util_1.sendSuccess)(res, stats, "Student statistics retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.studentController = new StudentController();
//# sourceMappingURL=student.controller.js.map
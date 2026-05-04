"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectController = void 0;
const subject_model_1 = require("../models/subject.model");
const class_subject_model_1 = require("../models/class-subject.model");
const class_model_1 = require("../models/class.model");
const user_model_1 = require("../models/user.model");
const session_model_1 = require("../models/session.model");
const response_util_1 = require("../utils/response.util");
const types_1 = require("../types");
const errors_util_1 = require("../utils/errors.util");
class SubjectController {
    /**
     * Create a new subject
     * POST /api/v1/subjects
     */
    async createSubject(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            // Check if code already exists for this school
            if (req.body.code) {
                const existing = await subject_model_1.Subject.findOne({
                    schoolId,
                    code: req.body.code.toUpperCase()
                });
                if (existing) {
                    throw new errors_util_1.ConflictError("Subject code already exists");
                }
            }
            const subject = await subject_model_1.Subject.create({
                ...req.body,
                schoolId,
            });
            (0, response_util_1.sendSuccess)(res, subject, "Subject created successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all subjects for a school
     * GET /api/v1/subjects
     */
    async getSubjects(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const subjects = await subject_model_1.Subject.find({ schoolId }).sort({ name: 1 });
            (0, response_util_1.sendSuccess)(res, subjects, "Subjects retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get subject by ID
     * GET /api/v1/subjects/:id
     */
    async getSubjectById(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const subject = await subject_model_1.Subject.findOne({ _id: id, schoolId });
            if (!subject) {
                throw new errors_util_1.NotFoundError("Subject not found");
            }
            (0, response_util_1.sendSuccess)(res, subject, "Subject retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a subject
     * PATCH /api/v1/subjects/:id
     */
    async updateSubject(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const subject = await subject_model_1.Subject.findOneAndUpdate({ _id: id, schoolId }, req.body, { new: true, runValidators: true });
            if (!subject) {
                throw new errors_util_1.NotFoundError("Subject not found");
            }
            (0, response_util_1.sendSuccess)(res, subject, "Subject updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Assign subject to class and teacher
     * POST /api/v1/subjects/assign
     */
    async assignToClass(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classId, subjectId, teacherId, sessionId } = req.body;
            const [classDoc, subject, teacher, session] = await Promise.all([
                class_model_1.Class.findOne({ _id: classId, schoolId }),
                subject_model_1.Subject.findOne({ _id: subjectId, schoolId, isActive: true }),
                user_model_1.User.findOne({
                    _id: teacherId,
                    schoolId,
                    role: types_1.UserRole.TEACHER,
                    status: "active",
                }),
                session_model_1.Session.findOne({ _id: sessionId, schoolId }),
            ]);
            if (!classDoc) {
                throw new errors_util_1.NotFoundError("Class not found");
            }
            if (!subject) {
                throw new errors_util_1.NotFoundError("Active subject not found");
            }
            if (!teacher) {
                throw new errors_util_1.NotFoundError("Active teacher not found for this school");
            }
            if (!session) {
                throw new errors_util_1.NotFoundError("Session not found");
            }
            // Check for existing assignment
            const existing = await class_subject_model_1.ClassSubject.findOne({
                schoolId,
                classId,
                subjectId,
                sessionId
            });
            if (existing) {
                throw new errors_util_1.ConflictError("Subject is already assigned to this class for the given session");
            }
            const assignment = await class_subject_model_1.ClassSubject.create({
                schoolId,
                classId,
                subjectId,
                teacherId,
                sessionId
            });
            (0, response_util_1.sendSuccess)(res, assignment, "Subject assigned to class successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get assignments for a class
     * GET /api/v1/subjects/assignments/:classId
     */
    async getClassAssignments(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classId } = req.params;
            const { sessionId } = req.query;
            const query = { schoolId, classId };
            if (sessionId)
                query.sessionId = sessionId;
            const assignments = await class_subject_model_1.ClassSubject.find(query)
                .populate("subjectId", "name code")
                .populate("teacherId", "firstName lastName")
                .populate("sessionId", "name");
            (0, response_util_1.sendSuccess)(res, assignments, "Class assignments retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update assignment (e.g., change teacher)
     * PATCH /api/v1/subjects/assignments/:id
     */
    async updateAssignment(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const teacher = await user_model_1.User.findOne({
                _id: req.body.teacherId,
                schoolId,
                role: types_1.UserRole.TEACHER,
                status: "active",
            });
            if (!teacher) {
                throw new errors_util_1.NotFoundError("Active teacher not found for this school");
            }
            const assignment = await class_subject_model_1.ClassSubject.findOneAndUpdate({ _id: id, schoolId }, { teacherId: req.body.teacherId }, { new: true });
            if (!assignment) {
                throw new errors_util_1.NotFoundError("Assignment not found");
            }
            (0, response_util_1.sendSuccess)(res, assignment, "Assignment updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.subjectController = new SubjectController();
//# sourceMappingURL=subject.controller.js.map
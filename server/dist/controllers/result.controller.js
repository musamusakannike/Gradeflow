"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultController = void 0;
const mongoose_1 = require("mongoose");
const resultService = __importStar(require("../services/result.service"));
const student_model_1 = require("../models/student.model");
const class_model_1 = require("../models/class.model");
const class_subject_model_1 = require("../models/class-subject.model");
const school_model_1 = require("../models/school.model");
const result_pdf_service_1 = require("../services/result-pdf.service");
const response_util_1 = require("../utils/response.util");
const types_1 = require("../types");
const errors_util_1 = require("../utils/errors.util");
class ResultController {
    async compileResult(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classId, termId } = req.body;
            const batch = await resultService.compileResultBatch(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId, req.user._id);
            (0, response_util_1.sendSuccess)(res, batch, "Result compiled successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async releaseResult(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classId, termId } = req.body;
            const batch = await resultService.releaseResultBatch(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId, req.user._id);
            (0, response_util_1.sendSuccess)(res, batch, "Result released successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async unreleaseResult(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classId, termId } = req.body;
            const batch = await resultService.unreleaseResultBatch(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId, req.user._id);
            (0, response_util_1.sendSuccess)(res, batch, "Result unreleased successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async getResultStatus(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classId, termId } = req.query;
            const batch = await resultService.getResultBatchStatus(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId);
            (0, response_util_1.sendSuccess)(res, batch, "Result status retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get student result for a term
     * GET /api/v1/results/student/:studentId
     */
    async getStudentResult(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const studentId = req.params.studentId;
            const { termId } = req.query;
            if (!termId) {
                throw new errors_util_1.BadRequestError("Term ID is required");
            }
            // Check if student belongs to school and user has permission
            const checkFees = req.user.role === types_1.UserRole.STUDENT;
            if (req.user.role === types_1.UserRole.STUDENT) {
                const student = await student_model_1.Student.findOne({
                    _id: studentId,
                    schoolId,
                    userId: req.user._id,
                }).select("_id");
                if (!student) {
                    throw new errors_util_1.ForbiddenError("Cannot access another student's result");
                }
            }
            if (req.user.role === types_1.UserRole.PARENT) {
                const student = await student_model_1.Student.findOne({
                    _id: studentId,
                    schoolId,
                    parentUserId: req.user._id,
                }).select("_id");
                if (!student) {
                    throw new errors_util_1.ForbiddenError("Cannot access another student's result");
                }
            }
            const result = await resultService.getStudentResult(new mongoose_1.Types.ObjectId(studentId), new mongoose_1.Types.ObjectId(termId), schoolId, req.user.role === types_1.UserRole.STUDENT || req.user.role === types_1.UserRole.PARENT);
            (0, response_util_1.sendSuccess)(res, result, "Result retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async downloadStudentResultPdf(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const studentId = req.params.studentId;
            const { termId } = req.query;
            if (!termId) {
                throw new errors_util_1.BadRequestError("Term ID is required");
            }
            if (req.user.role === types_1.UserRole.STUDENT) {
                const student = await student_model_1.Student.findOne({
                    _id: studentId,
                    schoolId,
                    userId: req.user._id,
                }).select("_id");
                if (!student) {
                    throw new errors_util_1.ForbiddenError("Cannot access another student's result");
                }
            }
            if (req.user.role === types_1.UserRole.PARENT) {
                const student = await student_model_1.Student.findOne({
                    _id: studentId,
                    schoolId,
                    parentUserId: req.user._id,
                }).select("_id");
                if (!student) {
                    throw new errors_util_1.ForbiddenError("Cannot access another student's result");
                }
            }
            const result = await resultService.getStudentResult(new mongoose_1.Types.ObjectId(studentId), new mongoose_1.Types.ObjectId(termId), schoolId, req.user.role === types_1.UserRole.STUDENT || req.user.role === types_1.UserRole.PARENT);
            const school = await school_model_1.School.findById(schoolId).select("name");
            const pdf = await (0, result_pdf_service_1.generateReportCardPdf)(result, school?.name || "GradeFlow");
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${result.student.studentId.replace(/\W+/g, "-")}-${result.term.name.replace(/\W+/g, "-")}.pdf"`);
            res.send(pdf);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get class results (broadsheet)
     * GET /api/v1/results/class/:classId
     */
    async getClassResults(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const classId = req.params.classId;
            const { termId } = req.query;
            if (!termId) {
                throw new errors_util_1.BadRequestError("Term ID is required");
            }
            if (req.user.role === types_1.UserRole.TEACHER) {
                const [classDoc, assignedSubject] = await Promise.all([
                    class_model_1.Class.findOne({
                        _id: classId,
                        schoolId,
                        classTeacherId: req.user._id,
                    }).select("_id"),
                    class_subject_model_1.ClassSubject.findOne({
                        classId,
                        schoolId,
                        teacherId: req.user._id,
                    }).select("_id"),
                ]);
                if (!classDoc && !assignedSubject) {
                    throw new errors_util_1.ForbiddenError("Cannot view results for this class");
                }
            }
            const results = await resultService.getClassResults(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId);
            (0, response_util_1.sendSuccess)(res, results, "Class results retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    async getClassAnalytics(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const classId = req.params.classId;
            const { termId } = req.query;
            if (!termId) {
                throw new errors_util_1.BadRequestError("Term ID is required");
            }
            if (req.user.role === types_1.UserRole.TEACHER) {
                const assignedSubject = await class_subject_model_1.ClassSubject.findOne({
                    classId,
                    schoolId,
                    teacherId: req.user._id,
                }).select("_id");
                if (!assignedSubject) {
                    throw new errors_util_1.ForbiddenError("Cannot view analytics for this class");
                }
            }
            const analytics = await resultService.getClassAnalytics(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId);
            (0, response_util_1.sendSuccess)(res, analytics, "Class analytics retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.resultController = new ResultController();
//# sourceMappingURL=result.controller.js.map
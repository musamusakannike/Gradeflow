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
const response_util_1 = require("../utils/response.util");
const types_1 = require("../types");
const errors_util_1 = require("../utils/errors.util");
class ResultController {
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
            const result = await resultService.getStudentResult(new mongoose_1.Types.ObjectId(studentId), new mongoose_1.Types.ObjectId(termId), schoolId, checkFees);
            (0, response_util_1.sendSuccess)(res, result, "Result retrieved successfully");
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
            const results = await resultService.getClassResults(new mongoose_1.Types.ObjectId(classId), new mongoose_1.Types.ObjectId(termId), schoolId);
            (0, response_util_1.sendSuccess)(res, results, "Class results retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.resultController = new ResultController();
//# sourceMappingURL=result.controller.js.map
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
exports.scoreController = void 0;
const mongoose_1 = require("mongoose");
const resultService = __importStar(require("../services/result.service"));
const response_util_1 = require("../utils/response.util");
const errors_util_1 = require("../utils/errors.util");
class ScoreController {
    /**
     * Enter or update a single score
     * POST /api/v1/scores
     */
    async enterScore(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { studentId, classSubjectId, termId, ...scoreData } = req.body;
            const score = await resultService.enterScores({
                studentId: new mongoose_1.Types.ObjectId(studentId),
                classSubjectId: new mongoose_1.Types.ObjectId(classSubjectId),
                termId: new mongoose_1.Types.ObjectId(termId),
                ...scoreData,
            }, schoolId);
            (0, response_util_1.sendSuccess)(res, score, "Score recorded successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk enter scores for a class subject
     * POST /api/v1/scores/bulk
     */
    async bulkEnterScores(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { classSubjectId, termId, scores } = req.body;
            const formattedScores = scores.map((s) => ({
                ...s,
                studentId: new mongoose_1.Types.ObjectId(s.studentId),
            }));
            const result = await resultService.bulkEnterScores(new mongoose_1.Types.ObjectId(classSubjectId), new mongoose_1.Types.ObjectId(termId), formattedScores, schoolId);
            (0, response_util_1.sendSuccess)(res, result, "Bulk score entry completed");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get subject results for a class
     * GET /api/v1/scores/subject/:classSubjectId
     */
    async getSubjectScores(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const classSubjectId = req.params.classSubjectId;
            const { termId } = req.query;
            if (!termId) {
                throw new errors_util_1.BadRequestError("Term ID is required");
            }
            const result = await resultService.getSubjectResults(new mongoose_1.Types.ObjectId(classSubjectId), new mongoose_1.Types.ObjectId(termId), schoolId);
            (0, response_util_1.sendSuccess)(res, result, "Subject scores retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.scoreController = new ScoreController();
//# sourceMappingURL=score.controller.js.map
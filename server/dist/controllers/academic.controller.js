"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicController = void 0;
const session_model_1 = require("../models/session.model");
const term_model_1 = require("../models/term.model");
const response_util_1 = require("../utils/response.util");
const errors_util_1 = require("../utils/errors.util");
/**
 * Academic Controller
 * Handles Session and Term management
 */
class AcademicController {
    // --- SESSION METHODS ---
    /**
     * Create a new academic session
     * POST /api/v1/sessions
     */
    async createSession(req, res, next) {
        try {
            const { startYear, isCurrent } = req.body;
            const schoolId = req.user.schoolId;
            const session = await session_model_1.Session.create({
                schoolId,
                startYear,
                isCurrent,
            });
            // Automatically create 3 terms for this session
            const currentYear = new Date().getFullYear();
            const termsData = [
                {
                    schoolId,
                    sessionId: session._id,
                    termNumber: 1,
                    name: "First Term",
                    startDate: new Date(startYear, 8, 1), // Sept 1st
                    endDate: new Date(startYear, 11, 15), // Dec 15th
                    isCurrent: isCurrent, // Set 1st term as current if session is current
                },
                {
                    schoolId,
                    sessionId: session._id,
                    termNumber: 2,
                    name: "Second Term",
                    startDate: new Date(startYear + 1, 0, 10), // Jan 10th
                    endDate: new Date(startYear + 1, 3, 10), // April 10th
                    isCurrent: false,
                },
                {
                    schoolId,
                    sessionId: session._id,
                    termNumber: 3,
                    name: "Third Term",
                    startDate: new Date(startYear + 1, 4, 1), // May 1st
                    endDate: new Date(startYear + 1, 6, 25), // July 25th
                    isCurrent: false,
                },
            ];
            await term_model_1.Term.insertMany(termsData);
            (0, response_util_1.sendSuccess)(res, session, "Academic session and terms created successfully", 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all sessions for a school
     * GET /api/v1/sessions
     */
    async getSessions(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const sessions = await session_model_1.Session.find({ schoolId }).sort({ startYear: -1 }).populate("terms");
            (0, response_util_1.sendSuccess)(res, sessions, "Sessions retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Set a session as current
     * PATCH /api/v1/sessions/:id/current
     */
    async setCurrentSession(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const session = await session_model_1.Session.findOne({ _id: id, schoolId });
            if (!session) {
                throw new errors_util_1.NotFoundError("Session not found");
            }
            session.isCurrent = true;
            await session.save();
            (0, response_util_1.sendSuccess)(res, session, "Current session updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    // --- TERM METHODS ---
    /**
     * Get all terms for a session
     * GET /api/v1/terms?sessionId=...
     */
    async getTerms(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { sessionId } = req.query;
            const query = { schoolId };
            if (sessionId)
                query.sessionId = sessionId;
            const terms = await term_model_1.Term.find(query).sort({ termNumber: 1 });
            (0, response_util_1.sendSuccess)(res, terms, "Terms retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update a term
     * PATCH /api/v1/terms/:id
     */
    async updateTerm(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const term = await term_model_1.Term.findOneAndUpdate({ _id: id, schoolId }, req.body, { new: true, runValidators: true });
            if (!term) {
                throw new errors_util_1.NotFoundError("Term not found");
            }
            (0, response_util_1.sendSuccess)(res, term, "Term updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Set a term as current
     * PATCH /api/v1/terms/:id/current
     */
    async setCurrentTerm(req, res, next) {
        try {
            const { id } = req.params;
            const schoolId = req.user.schoolId;
            const term = await term_model_1.Term.findOne({ _id: id, schoolId });
            if (!term) {
                throw new errors_util_1.NotFoundError("Term not found");
            }
            term.isCurrent = true;
            await term.save();
            (0, response_util_1.sendSuccess)(res, term, "Current term updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.academicController = new AcademicController();
//# sourceMappingURL=academic.controller.js.map
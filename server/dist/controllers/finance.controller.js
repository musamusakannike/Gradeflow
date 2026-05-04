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
exports.financeController = void 0;
const mongoose_1 = require("mongoose");
const paymentService = __importStar(require("../services/payment.service"));
const fee_status_model_1 = require("../models/fee-status.model");
const student_model_1 = require("../models/student.model");
const term_model_1 = require("../models/term.model");
const response_util_1 = require("../utils/response.util");
const types_1 = require("../types");
const errors_util_1 = require("../utils/errors.util");
class FinanceController {
    /**
     * Initialize a payment via Paystack
     * POST /api/v1/finance/payments/initialize
     */
    async initializePayment(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const { studentId, termId, amount, callbackUrl } = req.body;
            const student = await student_model_1.Student.findOne({
                _id: studentId,
                schoolId,
            }).select("userId");
            if (!student) {
                throw new errors_util_1.NotFoundError("Student not found");
            }
            if (req.user.role === types_1.UserRole.STUDENT &&
                student.userId.toString() !== req.user._id.toString()) {
                throw new errors_util_1.ForbiddenError("Cannot initialize payment for another student");
            }
            const result = await paymentService.initializePayment({
                studentId: new mongoose_1.Types.ObjectId(studentId),
                termId: new mongoose_1.Types.ObjectId(termId),
                amount,
                schoolId,
                callbackUrl
            });
            (0, response_util_1.sendSuccess)(res, result, "Payment initialized successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Verify a payment via Paystack
     * GET /api/v1/finance/payments/verify
     */
    async verifyPayment(req, res, next) {
        try {
            const reference = req.query.reference;
            if (!reference) {
                throw new errors_util_1.BadRequestError("Payment reference is required");
            }
            const payment = await paymentService.verifyPayment(reference);
            (0, response_util_1.sendSuccess)(res, payment, "Payment verified successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Handle Paystack Webhook
     * POST /api/v1/finance/webhook
     */
    async handleWebhook(req, res, next) {
        try {
            const signature = req.headers["x-paystack-signature"];
            await paymentService.handleWebhook(req.body, signature);
            res.status(200).send("Webhook processed");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get student fee status
     * GET /api/v1/finance/fee-status/:studentId
     */
    async getStudentFeeStatus(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const studentId = req.params.studentId;
            const { termId } = req.query;
            const query = {
                schoolId,
                studentId: new mongoose_1.Types.ObjectId(studentId)
            };
            if (req.user.role === types_1.UserRole.STUDENT) {
                const student = await student_model_1.Student.findOne({
                    _id: studentId,
                    schoolId,
                    userId: req.user._id,
                }).select("_id");
                if (!student) {
                    throw new errors_util_1.ForbiddenError("Cannot view another student's fee status");
                }
            }
            if (termId) {
                query.termId = new mongoose_1.Types.ObjectId(termId);
            }
            const status = await fee_status_model_1.FeeStatus.find(query)
                .populate("termId", "name")
                .sort({ createdAt: -1 });
            (0, response_util_1.sendSuccess)(res, status, "Fee status retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Set or update student fee status (Manual)
     * POST /api/v1/finance/fee-status
     */
    async setFeeStatus(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const updatedBy = req.user._id;
            const { studentId, termId, amountExpected, amountPaid, notes } = req.body;
            const [student, term] = await Promise.all([
                student_model_1.Student.findOne({ _id: studentId, schoolId }).select("_id"),
                term_model_1.Term.findOne({ _id: termId, schoolId }).select("_id"),
            ]);
            if (!student) {
                throw new errors_util_1.NotFoundError("Student not found");
            }
            if (!term) {
                throw new errors_util_1.NotFoundError("Term not found");
            }
            let feeStatus = await fee_status_model_1.FeeStatus.findOne({
                schoolId,
                studentId: new mongoose_1.Types.ObjectId(studentId),
                termId: new mongoose_1.Types.ObjectId(termId)
            });
            if (feeStatus) {
                feeStatus.amountExpected = amountExpected;
                if (amountPaid !== undefined)
                    feeStatus.amountPaid = amountPaid;
                feeStatus.notes = notes;
                feeStatus.updatedBy = updatedBy;
                await feeStatus.save();
            }
            else {
                feeStatus = await fee_status_model_1.FeeStatus.create({
                    schoolId,
                    studentId: new mongoose_1.Types.ObjectId(studentId),
                    termId: new mongoose_1.Types.ObjectId(termId),
                    amountExpected,
                    amountPaid: amountPaid || 0,
                    notes,
                    updatedBy
                });
            }
            (0, response_util_1.sendSuccess)(res, feeStatus, "Fee status updated successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get payment history for a student
     * GET /api/v1/finance/payments/student/:studentId
     */
    async getStudentPayments(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const studentId = req.params.studentId;
            if (req.user.role === types_1.UserRole.STUDENT) {
                const student = await student_model_1.Student.findOne({
                    _id: studentId,
                    schoolId,
                    userId: req.user._id,
                }).select("_id");
                if (!student) {
                    throw new errors_util_1.ForbiddenError("Cannot view another student's payments");
                }
            }
            const history = await paymentService.getPaymentHistory(new mongoose_1.Types.ObjectId(studentId), schoolId);
            (0, response_util_1.sendSuccess)(res, history, "Payment history retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get term financial statistics
     * GET /api/v1/finance/stats/:termId
     */
    async getTermStats(req, res, next) {
        try {
            const schoolId = req.user.schoolId;
            const termId = req.params.termId;
            const stats = await paymentService.getPaymentStats(new mongoose_1.Types.ObjectId(termId), schoolId);
            (0, response_util_1.sendSuccess)(res, stats, "Financial statistics retrieved successfully");
        }
        catch (error) {
            next(error);
        }
    }
}
exports.financeController = new FinanceController();
//# sourceMappingURL=finance.controller.js.map
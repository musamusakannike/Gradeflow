"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStats = exports.getPaymentsByTerm = exports.getPaymentHistory = exports.handleWebhook = exports.verifyPayment = exports.initializePayment = void 0;
const crypto_1 = __importDefault(require("crypto"));
const paystack_config_1 = require("../config/paystack.config");
const payment_model_1 = require("../models/payment.model");
const fee_status_model_1 = require("../models/fee-status.model");
const student_model_1 = require("../models/student.model");
const user_model_1 = require("../models/user.model");
const term_model_1 = require("../models/term.model");
const school_model_1 = require("../models/school.model");
const errors_util_1 = require("../utils/errors.util");
const logger_util_1 = require("../utils/logger.util");
const email_service_1 = require("./email.service");
/**
 * Initialize a payment
 */
const initializePayment = async (data) => {
    const paystack = (0, paystack_config_1.getPaystackClient)();
    // Get student details
    const student = await student_model_1.Student.findById(data.studentId).populate("userId");
    if (!student) {
        throw new errors_util_1.NotFoundError("Student not found");
    }
    const user = await user_model_1.User.findById(student.userId);
    if (!user) {
        throw new errors_util_1.NotFoundError("User not found");
    }
    // Get term details
    const term = await term_model_1.Term.findById(data.termId);
    if (!term) {
        throw new errors_util_1.NotFoundError("Term not found");
    }
    // Get school details
    const school = await school_model_1.School.findById(data.schoolId);
    if (!school) {
        throw new errors_util_1.NotFoundError("School not found");
    }
    // Create payment record
    const payment = await payment_model_1.Payment.create({
        schoolId: data.schoolId,
        studentId: data.studentId,
        termId: data.termId,
        amount: data.amount,
        status: "pending",
        metadata: {
            studentName: `${user.firstName} ${user.lastName}`,
            studentNumber: student.studentId,
            termName: term.name,
            schoolName: school.name,
        },
    });
    try {
        // Initialize with Paystack
        const response = await paystack.post("/transaction/initialize", {
            email: user.email,
            amount: Math.round(data.amount * 100), // Convert to kobo
            reference: payment.reference,
            currency: paystack_config_1.paystackConfig.currency,
            channels: paystack_config_1.paystackConfig.channels,
            callback_url: data.callbackUrl,
            metadata: {
                paymentId: payment._id.toString(),
                studentId: data.studentId.toString(),
                termId: data.termId.toString(),
                schoolId: data.schoolId.toString(),
                custom_fields: [
                    {
                        display_name: "Student Name",
                        variable_name: "student_name",
                        value: `${user.firstName} ${user.lastName}`,
                    },
                    {
                        display_name: "Student ID",
                        variable_name: "student_id",
                        value: student.studentId,
                    },
                    {
                        display_name: "Term",
                        variable_name: "term",
                        value: term.name,
                    },
                ],
            },
        });
        if (!response.data.status) {
            throw new errors_util_1.BadRequestError("Failed to initialize payment");
        }
        // Update payment with Paystack reference
        payment.paystackReference = response.data.data.reference;
        await payment.save();
        return {
            payment,
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
        };
    }
    catch (error) {
        // Update payment status on failure
        payment.status = "failed";
        await payment.save();
        throw error;
    }
};
exports.initializePayment = initializePayment;
/**
 * Verify a payment
 */
const verifyPayment = async (reference) => {
    const paystack = (0, paystack_config_1.getPaystackClient)();
    // Find payment
    const payment = await payment_model_1.Payment.findOne({
        $or: [{ reference }, { paystackReference: reference }],
    });
    if (!payment) {
        throw new errors_util_1.NotFoundError("Payment not found");
    }
    // If already verified, return
    if (payment.status === "success") {
        return payment;
    }
    try {
        // Verify with Paystack
        const response = await paystack.get(`/transaction/verify/${encodeURIComponent(reference)}`);
        if (!response.data.status) {
            throw new errors_util_1.BadRequestError("Failed to verify payment");
        }
        const { data } = response.data;
        // Update payment status
        if (data.status === "success") {
            payment.status = "success";
            payment.paidAt = new Date(data.paid_at);
            payment.channel = data.channel;
            await payment.save();
            // Update fee status
            await updateFeeStatus(payment);
            // Send confirmation email
            await sendConfirmationEmail(payment);
        }
        else if (data.status === "failed") {
            payment.status = "failed";
            await payment.save();
        }
        else if (data.status === "abandoned") {
            payment.status = "abandoned";
            await payment.save();
        }
        return payment;
    }
    catch (error) {
        logger_util_1.logger.error("Error verifying payment:", error);
        throw error;
    }
};
exports.verifyPayment = verifyPayment;
/**
 * Handle Paystack webhook
 */
const handleWebhook = async (payload, signature) => {
    // Verify webhook signature
    const hash = crypto_1.default
        .createHmac("sha512", paystack_config_1.paystackConfig.webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex");
    if (hash !== signature) {
        logger_util_1.logger.warn("Invalid webhook signature");
        throw new errors_util_1.BadRequestError("Invalid signature");
    }
    logger_util_1.logger.info("Processing webhook event:", payload.event);
    switch (payload.event) {
        case "charge.success":
            await handleChargeSuccess(payload.data);
            break;
        case "charge.failed":
            await handleChargeFailed(payload.data);
            break;
        default:
            logger_util_1.logger.info("Unhandled webhook event:", payload.event);
    }
};
exports.handleWebhook = handleWebhook;
/**
 * Handle successful charge
 */
const handleChargeSuccess = async (data) => {
    const payment = await payment_model_1.Payment.findOne({
        $or: [{ reference: data.reference }, { paystackReference: data.reference }],
    });
    if (!payment) {
        logger_util_1.logger.warn("Payment not found for reference:", data.reference);
        return;
    }
    if (payment.status === "success") {
        logger_util_1.logger.info("Payment already processed:", data.reference);
        return;
    }
    payment.status = "success";
    payment.paidAt = new Date();
    payment.channel = data.status;
    await payment.save();
    // Update fee status
    await updateFeeStatus(payment);
    // Send confirmation email
    await sendConfirmationEmail(payment);
};
/**
 * Handle failed charge
 */
const handleChargeFailed = async (data) => {
    const payment = await payment_model_1.Payment.findOne({
        $or: [{ reference: data.reference }, { paystackReference: data.reference }],
    });
    if (!payment) {
        logger_util_1.logger.warn("Payment not found for reference:", data.reference);
        return;
    }
    payment.status = "failed";
    await payment.save();
};
/**
 * Update fee status after successful payment
 */
const updateFeeStatus = async (payment) => {
    // Find or create fee status
    let feeStatus = await fee_status_model_1.FeeStatus.findOne({
        schoolId: payment.schoolId,
        studentId: payment.studentId,
        termId: payment.termId,
    });
    if (feeStatus) {
        feeStatus.amountPaid += payment.amount;
        feeStatus.balance = feeStatus.amountExpected - feeStatus.amountPaid;
        if (feeStatus.amountPaid >= feeStatus.amountExpected) {
            feeStatus.status = "paid";
            feeStatus.balance = 0;
        }
        else {
            feeStatus.status = "partial";
        }
        await feeStatus.save();
    }
    else {
        // If no fee status exists, create one (should not normally happen)
        logger_util_1.logger.warn("Fee status not found for payment, creating new one");
        await fee_status_model_1.FeeStatus.create({
            schoolId: payment.schoolId,
            studentId: payment.studentId,
            termId: payment.termId,
            amountExpected: payment.amount,
            amountPaid: payment.amount,
            balance: 0,
            status: "paid",
            updatedBy: payment.studentId, // Will be updated by system
        });
    }
};
/**
 * Send payment confirmation email
 */
const sendConfirmationEmail = async (payment) => {
    try {
        const student = await student_model_1.Student.findById(payment.studentId);
        if (!student)
            return;
        const user = await user_model_1.User.findById(student.userId);
        if (!user)
            return;
        const term = await term_model_1.Term.findById(payment.termId);
        const school = await school_model_1.School.findById(payment.schoolId);
        await (0, email_service_1.sendPaymentConfirmationEmail)(user.email, user.firstName, payment.amount, term?.name || "Term", payment.reference, school?.name || "School");
    }
    catch (error) {
        logger_util_1.logger.error("Error sending payment confirmation email:", error);
    }
};
/**
 * Get payment history for a student
 */
const getPaymentHistory = async (studentId, schoolId) => {
    return payment_model_1.Payment.find({ studentId, schoolId })
        .populate("termId", "name termNumber")
        .sort({ createdAt: -1 });
};
exports.getPaymentHistory = getPaymentHistory;
/**
 * Get payments by term
 */
const getPaymentsByTerm = async (termId, schoolId) => {
    return payment_model_1.Payment.find({ termId, schoolId, status: "success" })
        .populate({
        path: "studentId",
        populate: { path: "userId", select: "firstName lastName email" },
    })
        .sort({ createdAt: -1 });
};
exports.getPaymentsByTerm = getPaymentsByTerm;
/**
 * Get payment statistics for a term
 */
const getPaymentStats = async (termId, schoolId) => {
    const payments = await payment_model_1.Payment.find({ termId, schoolId });
    const stats = {
        totalAmount: 0,
        totalPayments: payments.length,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
    };
    payments.forEach((payment) => {
        if (payment.status === "success") {
            stats.totalAmount += payment.amount;
            stats.successfulPayments++;
        }
        else if (payment.status === "failed") {
            stats.failedPayments++;
        }
        else if (payment.status === "pending") {
            stats.pendingPayments++;
        }
    });
    return stats;
};
exports.getPaymentStats = getPaymentStats;
//# sourceMappingURL=payment.service.js.map
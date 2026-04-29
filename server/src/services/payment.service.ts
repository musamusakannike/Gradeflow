import { Types } from "mongoose";
import crypto from "crypto";
import {
  getPaystackClient,
  paystackConfig,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaystackWebhookEvent,
} from "../config/paystack.config";
import { Payment } from "../models/payment.model";
import { FeeStatus } from "../models/fee-status.model";
import { Student } from "../models/student.model";
import { User } from "../models/user.model";
import { Term } from "../models/term.model";
import { School } from "../models/school.model";
import { NotFoundError, BadRequestError } from "../utils/errors.util";
import { logger } from "../utils/logger.util";
import { sendPaymentConfirmationEmail } from "./email.service";

interface InitializePaymentData {
  studentId: Types.ObjectId;
  termId: Types.ObjectId;
  amount: number;
  schoolId: Types.ObjectId;
  callbackUrl?: string;
}

interface PaymentResult {
  payment: InstanceType<typeof Payment>;
  authorizationUrl: string;
  accessCode: string;
}

/**
 * Initialize a payment
 */
export const initializePayment = async (
  data: InitializePaymentData,
): Promise<PaymentResult> => {
  const paystack = getPaystackClient();

  // Get student details
  const student = await Student.findById(data.studentId).populate("userId");
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  const user = await User.findById(student.userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Get term details
  const term = await Term.findById(data.termId);
  if (!term) {
    throw new NotFoundError("Term not found");
  }

  // Get school details
  const school = await School.findById(data.schoolId);
  if (!school) {
    throw new NotFoundError("School not found");
  }

  // Create payment record
  const payment = await Payment.create({
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
    const response = await paystack.post<PaystackInitializeResponse>(
      "/transaction/initialize",
      {
        email: user.email,
        amount: Math.round(data.amount * 100), // Convert to kobo
        reference: payment.reference,
        currency: paystackConfig.currency,
        channels: paystackConfig.channels,
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
      },
    );

    if (!response.data.status) {
      throw new BadRequestError("Failed to initialize payment");
    }

    // Update payment with Paystack reference
    payment.paystackReference = response.data.data.reference;
    await payment.save();

    return {
      payment,
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
    };
  } catch (error) {
    // Update payment status on failure
    payment.status = "failed";
    await payment.save();
    throw error;
  }
};

/**
 * Verify a payment
 */
export const verifyPayment = async (
  reference: string,
): Promise<InstanceType<typeof Payment>> => {
  const paystack = getPaystackClient();

  // Find payment
  const payment = await Payment.findOne({
    $or: [{ reference }, { paystackReference: reference }],
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // If already verified, return
  if (payment.status === "success") {
    return payment;
  }

  try {
    // Verify with Paystack
    const response = await paystack.get<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );

    if (!response.data.status) {
      throw new BadRequestError("Failed to verify payment");
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
    } else if (data.status === "failed") {
      payment.status = "failed";
      await payment.save();
    } else if (data.status === "abandoned") {
      payment.status = "abandoned";
      await payment.save();
    }

    return payment;
  } catch (error) {
    logger.error("Error verifying payment:", error);
    throw error;
  }
};

/**
 * Handle Paystack webhook
 */
export const handleWebhook = async (
  payload: PaystackWebhookEvent,
  signature: string,
): Promise<void> => {
  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", paystackConfig.webhookSecret)
    .update(JSON.stringify(payload))
    .digest("hex");

  if (hash !== signature) {
    logger.warn("Invalid webhook signature");
    throw new BadRequestError("Invalid signature");
  }

  logger.info("Processing webhook event:", payload.event);

  switch (payload.event) {
    case "charge.success":
      await handleChargeSuccess(payload.data);
      break;
    case "charge.failed":
      await handleChargeFailed(payload.data);
      break;
    default:
      logger.info("Unhandled webhook event:", payload.event);
  }
};

/**
 * Handle successful charge
 */
const handleChargeSuccess = async (
  data: PaystackWebhookEvent["data"],
): Promise<void> => {
  const payment = await Payment.findOne({
    $or: [{ reference: data.reference }, { paystackReference: data.reference }],
  });

  if (!payment) {
    logger.warn("Payment not found for reference:", data.reference);
    return;
  }

  if (payment.status === "success") {
    logger.info("Payment already processed:", data.reference);
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
const handleChargeFailed = async (
  data: PaystackWebhookEvent["data"],
): Promise<void> => {
  const payment = await Payment.findOne({
    $or: [{ reference: data.reference }, { paystackReference: data.reference }],
  });

  if (!payment) {
    logger.warn("Payment not found for reference:", data.reference);
    return;
  }

  payment.status = "failed";
  await payment.save();
};

/**
 * Update fee status after successful payment
 */
const updateFeeStatus = async (
  payment: InstanceType<typeof Payment>,
): Promise<void> => {
  // Find or create fee status
  let feeStatus = await FeeStatus.findOne({
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
    } else {
      feeStatus.status = "partial";
    }

    await feeStatus.save();
  } else {
    // If no fee status exists, create one (should not normally happen)
    logger.warn("Fee status not found for payment, creating new one");

    await FeeStatus.create({
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
const sendConfirmationEmail = async (
  payment: InstanceType<typeof Payment>,
): Promise<void> => {
  try {
    const student = await Student.findById(payment.studentId);
    if (!student) return;

    const user = await User.findById(student.userId);
    if (!user) return;

    const term = await Term.findById(payment.termId);
    const school = await School.findById(payment.schoolId);

    await sendPaymentConfirmationEmail(
      user.email,
      user.firstName,
      payment.amount,
      term?.name || "Term",
      payment.reference,
      school?.name || "School",
    );
  } catch (error) {
    logger.error("Error sending payment confirmation email:", error);
  }
};

/**
 * Get payment history for a student
 */
export const getPaymentHistory = async (
  studentId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<InstanceType<typeof Payment>[]> => {
  return Payment.find({ studentId, schoolId })
    .populate("termId", "name termNumber")
    .sort({ createdAt: -1 });
};

/**
 * Get payments by term
 */
export const getPaymentsByTerm = async (
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<InstanceType<typeof Payment>[]> => {
  return Payment.find({ termId, schoolId, status: "success" })
    .populate({
      path: "studentId",
      populate: { path: "userId", select: "firstName lastName email" },
    })
    .sort({ createdAt: -1 });
};

/**
 * Get payment statistics for a term
 */
export const getPaymentStats = async (
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<{
  totalAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
}> => {
  const payments = await Payment.find({ termId, schoolId });

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
    } else if (payment.status === "failed") {
      stats.failedPayments++;
    } else if (payment.status === "pending") {
      stats.pendingPayments++;
    }
  });

  return stats;
};

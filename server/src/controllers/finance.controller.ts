import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import * as paymentService from "../services/payment.service";
import { FeeStatus } from "../models/fee-status.model";
import { Student } from "../models/student.model";
import { Term } from "../models/term.model";
import { sendSuccess } from "../utils/response.util";
import { AuthenticatedRequest, UserRole } from "../types";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors.util";

class FinanceController {
  /**
   * Initialize a payment via Paystack
   * POST /api/v1/finance/payments/initialize
   */
  async initializePayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const { studentId, termId, amount, callbackUrl } = req.body;

      const student = await Student.findOne({
        _id: studentId,
        schoolId,
      }).select("userId");

      if (!student) {
        throw new NotFoundError("Student not found");
      }

      if (
        req.user!.role === UserRole.STUDENT &&
        student.userId.toString() !== req.user!._id.toString()
      ) {
        throw new ForbiddenError("Cannot initialize payment for another student");
      }

      const result = await paymentService.initializePayment({
        studentId: new Types.ObjectId(studentId as string),
        termId: new Types.ObjectId(termId as string),
        amount,
        schoolId,
        callbackUrl
      });

      sendSuccess(res, result, "Payment initialized successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify a payment via Paystack
   * GET /api/v1/finance/payments/verify
   */
  async verifyPayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reference = req.query.reference as string;
      if (!reference) {
        throw new BadRequestError("Payment reference is required");
      }

      const payment = await paymentService.verifyPayment(reference);
      sendSuccess(res, payment, "Payment verified successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Paystack Webhook
   * POST /api/v1/finance/webhook
   */
  async handleWebhook(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      await paymentService.handleWebhook(req.body, signature);
      res.status(200).send("Webhook processed");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student fee status
   * GET /api/v1/finance/fee-status/:studentId
   */
  async getStudentFeeStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const studentId = req.params.studentId as string;
      const { termId } = req.query;

      const query: any = { 
        schoolId, 
        studentId: new Types.ObjectId(studentId) 
      };

      if (req.user!.role === UserRole.STUDENT) {
        const student = await Student.findOne({
          _id: studentId,
          schoolId,
          userId: req.user!._id,
        }).select("_id");

        if (!student) {
          throw new ForbiddenError("Cannot view another student's fee status");
        }
      }
      
      if (termId) {
        query.termId = new Types.ObjectId(termId as string);
      }

      const status = await FeeStatus.find(query)
        .populate("termId", "name")
        .sort({ createdAt: -1 });

      sendSuccess(res, status, "Fee status retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set or update student fee status (Manual)
   * POST /api/v1/finance/fee-status
   */
  async setFeeStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const updatedBy = req.user!._id;
      const { studentId, termId, amountExpected, amountPaid, notes } = req.body;

      const [student, term] = await Promise.all([
        Student.findOne({ _id: studentId, schoolId }).select("_id"),
        Term.findOne({ _id: termId, schoolId }).select("_id"),
      ]);

      if (!student) {
        throw new NotFoundError("Student not found");
      }

      if (!term) {
        throw new NotFoundError("Term not found");
      }

      let feeStatus = await FeeStatus.findOne({
        schoolId,
        studentId: new Types.ObjectId(studentId as string),
        termId: new Types.ObjectId(termId as string)
      });

      if (feeStatus) {
        feeStatus.amountExpected = amountExpected;
        if (amountPaid !== undefined) feeStatus.amountPaid = amountPaid;
        feeStatus.notes = notes;
        feeStatus.updatedBy = updatedBy;
        await feeStatus.save();
      } else {
        feeStatus = await FeeStatus.create({
          schoolId,
          studentId: new Types.ObjectId(studentId as string),
          termId: new Types.ObjectId(termId as string),
          amountExpected,
          amountPaid: amountPaid || 0,
          notes,
          updatedBy
        });
      }

      sendSuccess(res, feeStatus, "Fee status updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment history for a student
   * GET /api/v1/finance/payments/student/:studentId
   */
  async getStudentPayments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const studentId = req.params.studentId as string;

      if (req.user!.role === UserRole.STUDENT) {
        const student = await Student.findOne({
          _id: studentId,
          schoolId,
          userId: req.user!._id,
        }).select("_id");

        if (!student) {
          throw new ForbiddenError("Cannot view another student's payments");
        }
      }

      const history = await paymentService.getPaymentHistory(
        new Types.ObjectId(studentId),
        schoolId
      );

      sendSuccess(res, history, "Payment history retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get term financial statistics
   * GET /api/v1/finance/stats/:termId
   */
  async getTermStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schoolId = req.user!.schoolId as unknown as Types.ObjectId;
      const termId = req.params.termId as string;

      const stats = await paymentService.getPaymentStats(
        new Types.ObjectId(termId),
        schoolId
      );

      sendSuccess(res, stats, "Financial statistics retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IPayment, PaymentStatus } from '../types/index';
import { generateId } from '../utils/helpers.util';

export interface PaymentDocument extends Omit<IPayment, '_id'>, Document {}

const paymentSchema = new Schema<PaymentDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: 'Term',
      required: [true, 'Term is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [100, 'Minimum payment is 100 NGN'],
    },
    reference: {
      type: String,
      required: [true, 'Reference is required'],
      unique: true,
    },
    paystackReference: {
      type: String,
      sparse: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'abandoned'] as PaymentStatus[],
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    channel: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ schoolId: 1, studentId: 1 });
paymentSchema.index({ schoolId: 1, termId: 1 });
paymentSchema.index({ reference: 1 });
paymentSchema.index({ paystackReference: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Generate reference before validation
paymentSchema.pre('validate', function (this: PaymentDocument) {
  if (!this.reference) {
    this.reference = `GF-${generateId()}`;
  }
});

// Virtual for student
paymentSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for term
paymentSchema.virtual('term', {
  ref: 'Term',
  localField: 'termId',
  foreignField: '_id',
  justOne: true,
});

export const Payment: Model<PaymentDocument> = mongoose.model<PaymentDocument>(
  'Payment',
  paymentSchema
);

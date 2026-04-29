import mongoose, { Schema, Document, Model } from 'mongoose';
import { IFeeStatus, FeeStatusType } from '../types/index';

export interface FeeStatusDocument extends Omit<IFeeStatus, '_id'>, Document {}

const feeStatusSchema = new Schema<FeeStatusDocument>(
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
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial'] as FeeStatusType[],
      default: 'unpaid',
    },
    amountExpected: {
      type: Number,
      required: [true, 'Expected amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
    balance: {
      type: Number,
      default: 0,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Updated by is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index - one fee status per student per term
feeStatusSchema.index({ schoolId: 1, studentId: 1, termId: 1 }, { unique: true });

// Other indexes
feeStatusSchema.index({ schoolId: 1, termId: 1, status: 1 });
feeStatusSchema.index({ studentId: 1 });

// Calculate balance and update status before saving
feeStatusSchema.pre('save', function (this: FeeStatusDocument) {
  // Calculate balance
  this.balance = this.amountExpected - this.amountPaid;
  
  // Update status based on payment
  if (this.amountPaid >= this.amountExpected) {
    this.status = 'paid';
    this.balance = 0;
  } else if (this.amountPaid > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }
});

// Virtual for student
feeStatusSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for term
feeStatusSchema.virtual('term', {
  ref: 'Term',
  localField: 'termId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for updater
feeStatusSchema.virtual('updater', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

export const FeeStatus: Model<FeeStatusDocument> = mongoose.model<FeeStatusDocument>(
  'FeeStatus',
  feeStatusSchema
);

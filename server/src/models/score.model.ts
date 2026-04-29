import mongoose, { Schema, Document, Model } from 'mongoose';
import { IScore } from '../types/index';
import { calculateGrade } from '../utils/helpers.util';

export interface ScoreDocument extends Omit<IScore, '_id'>, Document {}

const scoreSchema = new Schema<ScoreDocument>(
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
    classSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSubject',
      required: [true, 'Class subject is required'],
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: 'Term',
      required: [true, 'Term is required'],
    },
    test1: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
      max: [20, 'Test 1 score cannot exceed 20'],
    },
    test2: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
      max: [20, 'Test 2 score cannot exceed 20'],
    },
    exam: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
      max: [60, 'Exam score cannot exceed 60'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total cannot be negative'],
      max: [100, 'Total cannot exceed 100'],
    },
    grade: {
      type: String,
      default: 'F',
    },
    remark: {
      type: String,
      default: 'Fail',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index - one score per student per subject per term
scoreSchema.index(
  { schoolId: 1, studentId: 1, classSubjectId: 1, termId: 1 },
  { unique: true }
);

// Other indexes
scoreSchema.index({ schoolId: 1, termId: 1 });
scoreSchema.index({ studentId: 1, termId: 1 });
scoreSchema.index({ classSubjectId: 1, termId: 1 });

// Calculate total and grade before saving
scoreSchema.pre('save', function (this: ScoreDocument) {
  // Calculate total
  this.total = (this.test1 || 0) + (this.test2 || 0) + (this.exam || 0);
  
  // Calculate grade and remark
  const gradeInfo = calculateGrade(this.total);
  this.grade = gradeInfo.grade;
  this.remark = gradeInfo.remark;
});

// Virtual for student
scoreSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for class subject
scoreSchema.virtual('classSubject', {
  ref: 'ClassSubject',
  localField: 'classSubjectId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for term
scoreSchema.virtual('term', {
  ref: 'Term',
  localField: 'termId',
  foreignField: '_id',
  justOne: true,
});

export const Score: Model<ScoreDocument> = mongoose.model<ScoreDocument>('Score', scoreSchema);

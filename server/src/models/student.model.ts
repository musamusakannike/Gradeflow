import mongoose, { Schema, Document, Model } from 'mongoose';
import { IStudent, Gender, StudentStatus } from '../types/index';

export interface StudentDocument extends Omit<IStudent, '_id'>, Document {}

const studentSchema = new Schema<StudentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'] as Gender[],
      required: [true, 'Gender is required'],
    },
    address: {
      type: String,
      trim: true,
    },
    parentName: {
      type: String,
      required: [true, 'Parent/Guardian name is required'],
      trim: true,
    },
    parentPhone: {
      type: String,
      required: [true, 'Parent/Guardian phone is required'],
      trim: true,
    },
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(StudentStatus),
      default: StudentStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index for studentId within a school
studentSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

// Other indexes
studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, status: 1 });
studentSchema.index({ userId: 1 });

// Virtual to populate user details
studentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate class details
studentSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: '_id',
  justOne: true,
});

export const Student: Model<StudentDocument> = mongoose.model<StudentDocument>(
  'Student',
  studentSchema
);

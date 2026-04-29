import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISubject } from '../types/index';

export interface SubjectDocument extends Omit<ISubject, '_id'>, Document {}

const subjectSchema = new Schema<SubjectDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
      trim: true,
      maxlength: [10, 'Subject code cannot exceed 10 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique indexes
subjectSchema.index({ schoolId: 1, name: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, isActive: 1 });

// Generate subject code from name if not provided
subjectSchema.pre('validate', function (this: SubjectDocument) {
  if (!this.code && this.name) {
    const words = this.name.split(' ');
    let code = '';
    if (words.length >= 2) {
      code = words.map((w) => w.charAt(0)).join('').toUpperCase();
    } else {
      code = this.name.substring(0, 3).toUpperCase();
    }
    this.code = code.substring(0, 10);
  }
});

export const Subject: Model<SubjectDocument> = mongoose.model<SubjectDocument>(
  'Subject',
  subjectSchema
);

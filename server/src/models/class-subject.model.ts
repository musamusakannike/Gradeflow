import mongoose, { Schema, Document, Model } from "mongoose";
import { IClassSubject } from "../types/index";

export interface ClassSubjectDocument
  extends Omit<IClassSubject, "_id">, Document {}

const classSubjectSchema = new Schema<ClassSubjectDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound unique index - one subject per class per session
classSubjectSchema.index(
  { schoolId: 1, classId: 1, subjectId: 1, sessionId: 1 },
  { unique: true },
);

// Other indexes
classSubjectSchema.index({ schoolId: 1, teacherId: 1 });
classSubjectSchema.index({ schoolId: 1, classId: 1 });

// Virtual for class
classSubjectSchema.virtual("class", {
  ref: "Class",
  localField: "classId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for subject
classSubjectSchema.virtual("subject", {
  ref: "Subject",
  localField: "subjectId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for teacher
classSubjectSchema.virtual("teacher", {
  ref: "User",
  localField: "teacherId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for session
classSubjectSchema.virtual("session", {
  ref: "Session",
  localField: "sessionId",
  foreignField: "_id",
  justOne: true,
});

export const ClassSubject: Model<ClassSubjectDocument> =
  mongoose.model<ClassSubjectDocument>("ClassSubject", classSubjectSchema);

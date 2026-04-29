import mongoose, { Schema, Document, Model } from "mongoose";
import { IResultBatch, ResultBatchStatus } from "../types/index";

export interface ResultBatchDocument
  extends Omit<IResultBatch, "_id">,
    Document {}

const resultBatchSchema = new Schema<ResultBatchDocument>(
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
    termId: {
      type: Schema.Types.ObjectId,
      ref: "Term",
      required: [true, "Term is required"],
    },
    status: {
      type: String,
      enum: ["draft", "compiled", "released"] as ResultBatchStatus[],
      default: "draft",
    },
    totalStudents: {
      type: Number,
      default: 0,
      min: [0, "Total students cannot be negative"],
    },
    totalSubjects: {
      type: Number,
      default: 0,
      min: [0, "Total subjects cannot be negative"],
    },
    totalScores: {
      type: Number,
      default: 0,
      min: [0, "Total scores cannot be negative"],
    },
    compiledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Compiler is required"],
    },
    compiledAt: {
      type: Date,
      default: Date.now,
    },
    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    unreleasedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unreleasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

resultBatchSchema.index(
  { schoolId: 1, classId: 1, termId: 1 },
  { unique: true },
);
resultBatchSchema.index({ schoolId: 1, termId: 1, status: 1 });

resultBatchSchema.virtual("class", {
  ref: "Class",
  localField: "classId",
  foreignField: "_id",
  justOne: true,
});

resultBatchSchema.virtual("term", {
  ref: "Term",
  localField: "termId",
  foreignField: "_id",
  justOne: true,
});

export const ResultBatch: Model<ResultBatchDocument> =
  mongoose.model<ResultBatchDocument>("ResultBatch", resultBatchSchema);

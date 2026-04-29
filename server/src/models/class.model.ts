import mongoose, { Schema, Document, Model } from "mongoose";
import { IClass } from "../types/index";

export interface ClassDocument extends Omit<IClass, "_id">, Document {}

const classSchema = new Schema<ClassDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
    },
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: [50, "Class name cannot exceed 50 characters"],
    },
    level: {
      type: Number,
      required: [true, "Class level is required"],
      min: [1, "Level must be at least 1"],
      max: [12, "Level cannot exceed 12"],
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [5, "Section cannot exceed 5 characters"],
    },
    classTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    capacity: {
      type: Number,
      default: 50,
      min: [10, "Capacity must be at least 10"],
      max: [200, "Capacity cannot exceed 200"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound unique index for class name within a school
classSchema.index({ schoolId: 1, name: 1 }, { unique: true });
classSchema.index({ schoolId: 1, level: 1 });

// Virtual for class teacher
classSchema.virtual("classTeacher", {
  ref: "User",
  localField: "classTeacherId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for students count
classSchema.virtual("studentsCount", {
  ref: "Student",
  localField: "_id",
  foreignField: "classId",
  count: true,
});

// Virtual for subjects
classSchema.virtual("subjects", {
  ref: "ClassSubject",
  localField: "_id",
  foreignField: "classId",
});

export const Class: Model<ClassDocument> = mongoose.model<ClassDocument>(
  "Class",
  classSchema,
);

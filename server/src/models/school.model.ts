import mongoose, { Schema, Document, Model } from "mongoose";
import { ISchool } from "../types/index";

export interface SchoolDocument extends Omit<ISchool, "_id">, Document {}

const schoolSchema = new Schema<SchoolDocument>(
  {
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      maxlength: [200, "School name cannot exceed 200 characters"],
    },
    code: {
      type: String,
      required: [true, "School code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, "School code cannot exceed 10 characters"],
    },
    email: {
      type: String,
      required: [true, "School email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "School phone is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "School address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    motto: {
      type: String,
      trim: true,
      maxlength: [500, "Motto cannot exceed 500 characters"],
    },
    established: {
      type: Number,
      min: [1800, "Invalid establishment year"],
      max: [
        new Date().getFullYear(),
        "Establishment year cannot be in the future",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      maxStudentsPerClass: {
        type: Number,
        default: 50,
        min: [10, "Minimum students per class is 10"],
        max: [200, "Maximum students per class is 200"],
      },
      gradingScale: {
        type: String,
        enum: ["default", "custom"],
        default: "default",
      },
      customGrades: [
        {
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          grade: { type: String, required: true },
          remark: { type: String, required: true },
        },
      ],
      resultReleaseMode: {
        type: String,
        enum: ["automatic", "manual"],
        default: "automatic",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
schoolSchema.index({ name: "text" });
schoolSchema.index({ state: 1, city: 1 });
schoolSchema.index({ isActive: 1 });

// Generate school code from name
schoolSchema.pre("validate", function (this: SchoolDocument) {
  if (!this.code && this.name) {
    const words = this.name.split(" ");
    let code = "";
    if (words.length >= 2) {
      code = words
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase();
    } else {
      code = this.name.substring(0, 4).toUpperCase();
    }
    // Add random suffix for uniqueness
    code += Math.random().toString(36).substring(2, 5).toUpperCase();
    this.code = code.substring(0, 10);
  }
});

export const School: Model<SchoolDocument> = mongoose.model<SchoolDocument>(
  "School",
  schoolSchema,
);

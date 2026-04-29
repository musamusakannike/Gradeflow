import mongoose, { Schema, Document, Model } from "mongoose";
import { ITerm, TermNumber } from "../types/index";

export interface TermDocument extends Omit<ITerm, "_id">, Document {}

const termSchema = new Schema<TermDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session is required"],
    },
    name: {
      type: String,
      required: [true, "Term name is required"],
      trim: true,
    },
    termNumber: {
      type: Number,
      required: [true, "Term number is required"],
      enum: [1, 2, 3] as TermNumber[],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound unique index
termSchema.index(
  { schoolId: 1, sessionId: 1, termNumber: 1 },
  { unique: true },
);
termSchema.index({ schoolId: 1, isCurrent: 1 });

// Generate term name if not provided
termSchema.pre("validate", function (this: TermDocument) {
  if (!this.name && this.termNumber) {
    const termNames: Record<number, string> = {
      1: "First Term",
      2: "Second Term",
      3: "Third Term",
    };
    this.name = termNames[this.termNumber] || `Term ${this.termNumber}`;
  }

  // Validate dates
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    throw new Error("End date must be after start date");
  }
});

// Ensure only one current term per school
termSchema.pre("save", async function (this: TermDocument) {
  if (this.isCurrent && this.isModified("isCurrent")) {
    await mongoose
      .model("Term")
      .updateMany(
        { schoolId: this.schoolId, _id: { $ne: this._id } },
        { isCurrent: false },
      );
  }
});

// Virtual for session
termSchema.virtual("session", {
  ref: "Session",
  localField: "sessionId",
  foreignField: "_id",
  justOne: true,
});

export const Term: Model<TermDocument> = mongoose.model<TermDocument>(
  "Term",
  termSchema,
);

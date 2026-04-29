import mongoose, { Schema, Document, Model } from "mongoose";
import { ISession } from "../types/index";

export interface SessionDocument extends Omit<ISession, "_id">, Document {}

const sessionSchema = new Schema<SessionDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
    },
    name: {
      type: String,
      required: [true, "Session name is required"],
      trim: true,
    },
    startYear: {
      type: Number,
      required: [true, "Start year is required"],
      min: [2000, "Start year must be after 2000"],
    },
    endYear: {
      type: Number,
      required: [true, "End year is required"],
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
sessionSchema.index(
  { schoolId: 1, startYear: 1, endYear: 1 },
  { unique: true },
);
sessionSchema.index({ schoolId: 1, isCurrent: 1 });

// Validate endYear is startYear + 1
sessionSchema.pre("validate", function (this: SessionDocument) {
  if (this.startYear && !this.endYear) {
    this.endYear = this.startYear + 1;
  }

  if (this.startYear && this.endYear && this.endYear !== this.startYear + 1) {
    throw new Error("End year must be exactly one year after start year");
  }

  if (!this.name && this.startYear && this.endYear) {
    this.name = `${this.startYear}/${this.endYear}`;
  }
});

// Ensure only one current session per school
sessionSchema.pre("save", async function (this: SessionDocument) {
  if (this.isCurrent && this.isModified("isCurrent")) {
    await mongoose
      .model("Session")
      .updateMany(
        { schoolId: this.schoolId, _id: { $ne: this._id } },
        { isCurrent: false },
      );
  }
});

// Virtual for terms
sessionSchema.virtual("terms", {
  ref: "Term",
  localField: "_id",
  foreignField: "sessionId",
});

export const Session: Model<SessionDocument> = mongoose.model<SessionDocument>(
  "Session",
  sessionSchema,
);

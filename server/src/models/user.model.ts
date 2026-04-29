import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, UserRole, UserStatus } from "../types/index";

export interface UserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: function (this: UserDocument) {
        return this.role !== "super_admin";
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"] as UserStatus[],
      default: "active",
    },
    avatar: {
      type: String,
      default: null,
    },
    expoPushToken: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for full name
userSchema.virtual("fullName").get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre("save", async function (this: UserDocument) {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error as Error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export const User: Model<UserDocument> = mongoose.model<UserDocument>(
  "User",
  userSchema,
);

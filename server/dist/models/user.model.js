"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../types/index");
const userSchema = new mongoose_1.Schema({
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
        enum: Object.values(index_1.UserRole),
        default: index_1.UserRole.STUDENT,
    },
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "School",
        required: function () {
            return this.role !== "super_admin";
        },
    },
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual for full name
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
// Indexes
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
    }
    catch (error) {
        throw error;
    }
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
};
exports.User = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=user.model.js.map
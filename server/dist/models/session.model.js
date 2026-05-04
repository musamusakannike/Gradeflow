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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const sessionSchema = new mongoose_1.Schema({
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index
sessionSchema.index({ schoolId: 1, startYear: 1, endYear: 1 }, { unique: true });
sessionSchema.index({ schoolId: 1, isCurrent: 1 });
// Validate endYear is startYear + 1
sessionSchema.pre("validate", function () {
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
sessionSchema.pre("save", async function () {
    if (this.isCurrent && this.isModified("isCurrent")) {
        await mongoose_1.default
            .model("Session")
            .updateMany({ schoolId: this.schoolId, _id: { $ne: this._id } }, { isCurrent: false });
    }
});
// Virtual for terms
sessionSchema.virtual("terms", {
    ref: "Term",
    localField: "_id",
    foreignField: "sessionId",
});
exports.Session = mongoose_1.default.model("Session", sessionSchema);
//# sourceMappingURL=session.model.js.map
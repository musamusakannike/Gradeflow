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
exports.Term = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const termSchema = new mongoose_1.Schema({
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "School",
        required: [true, "School is required"],
    },
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: [1, 2, 3],
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index
termSchema.index({ schoolId: 1, sessionId: 1, termNumber: 1 }, { unique: true });
termSchema.index({ schoolId: 1, isCurrent: 1 });
// Generate term name if not provided
termSchema.pre("validate", function () {
    if (!this.name && this.termNumber) {
        const termNames = {
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
termSchema.pre("save", async function () {
    if (this.isCurrent && this.isModified("isCurrent")) {
        await mongoose_1.default
            .model("Term")
            .updateMany({ schoolId: this.schoolId, _id: { $ne: this._id } }, { isCurrent: false });
    }
});
// Virtual for session
termSchema.virtual("session", {
    ref: "Session",
    localField: "sessionId",
    foreignField: "_id",
    justOne: true,
});
exports.Term = mongoose_1.default.model("Term", termSchema);
//# sourceMappingURL=term.model.js.map
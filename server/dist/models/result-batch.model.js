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
exports.ResultBatch = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const resultBatchSchema = new mongoose_1.Schema({
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "School",
        required: [true, "School is required"],
    },
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Class",
        required: [true, "Class is required"],
    },
    termId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Term",
        required: [true, "Term is required"],
    },
    status: {
        type: String,
        enum: ["draft", "compiled", "released"],
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Compiler is required"],
    },
    compiledAt: {
        type: Date,
        default: Date.now,
    },
    releasedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    releasedAt: {
        type: Date,
        default: null,
    },
    unreleasedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    unreleasedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
resultBatchSchema.index({ schoolId: 1, classId: 1, termId: 1 }, { unique: true });
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
exports.ResultBatch = mongoose_1.default.model("ResultBatch", resultBatchSchema);
//# sourceMappingURL=result-batch.model.js.map
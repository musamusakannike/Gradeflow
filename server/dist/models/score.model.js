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
exports.Score = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const helpers_util_1 = require("../utils/helpers.util");
const scoreSchema = new mongoose_1.Schema({
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School is required'],
    },
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student is required'],
    },
    classSubjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClassSubject',
        required: [true, 'Class subject is required'],
    },
    termId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Term',
        required: [true, 'Term is required'],
    },
    test1: {
        type: Number,
        default: 0,
        min: [0, 'Score cannot be negative'],
        max: [20, 'Test 1 score cannot exceed 20'],
    },
    test2: {
        type: Number,
        default: 0,
        min: [0, 'Score cannot be negative'],
        max: [20, 'Test 2 score cannot exceed 20'],
    },
    exam: {
        type: Number,
        default: 0,
        min: [0, 'Score cannot be negative'],
        max: [60, 'Exam score cannot exceed 60'],
    },
    total: {
        type: Number,
        default: 0,
        min: [0, 'Total cannot be negative'],
        max: [100, 'Total cannot exceed 100'],
    },
    grade: {
        type: String,
        default: 'F',
    },
    remark: {
        type: String,
        default: 'Fail',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index - one score per student per subject per term
scoreSchema.index({ schoolId: 1, studentId: 1, classSubjectId: 1, termId: 1 }, { unique: true });
// Other indexes
scoreSchema.index({ schoolId: 1, termId: 1 });
scoreSchema.index({ studentId: 1, termId: 1 });
scoreSchema.index({ classSubjectId: 1, termId: 1 });
// Calculate total and grade before saving
scoreSchema.pre('save', function () {
    // Calculate total
    this.total = (this.test1 || 0) + (this.test2 || 0) + (this.exam || 0);
    // Calculate grade and remark
    const gradeInfo = (0, helpers_util_1.calculateGrade)(this.total);
    this.grade = gradeInfo.grade;
    this.remark = gradeInfo.remark;
});
// Virtual for student
scoreSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for class subject
scoreSchema.virtual('classSubject', {
    ref: 'ClassSubject',
    localField: 'classSubjectId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for term
scoreSchema.virtual('term', {
    ref: 'Term',
    localField: 'termId',
    foreignField: '_id',
    justOne: true,
});
exports.Score = mongoose_1.default.model('Score', scoreSchema);
//# sourceMappingURL=score.model.js.map
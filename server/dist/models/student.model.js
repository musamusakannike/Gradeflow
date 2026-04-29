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
exports.Student = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const index_1 = require("../types/index");
const studentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        unique: true,
    },
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School is required'],
    },
    studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        trim: true,
    },
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class is required'],
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Gender is required'],
    },
    address: {
        type: String,
        trim: true,
    },
    parentName: {
        type: String,
        required: [true, 'Parent/Guardian name is required'],
        trim: true,
    },
    parentPhone: {
        type: String,
        required: [true, 'Parent/Guardian phone is required'],
        trim: true,
    },
    parentEmail: {
        type: String,
        lowercase: true,
        trim: true,
    },
    admissionDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: Object.values(index_1.StudentStatus),
        default: index_1.StudentStatus.ACTIVE,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index for studentId within a school
studentSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });
// Other indexes
studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, status: 1 });
studentSchema.index({ userId: 1 });
// Virtual to populate user details
studentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});
// Virtual to populate class details
studentSchema.virtual('class', {
    ref: 'Class',
    localField: 'classId',
    foreignField: '_id',
    justOne: true,
});
exports.Student = mongoose_1.default.model('Student', studentSchema);
//# sourceMappingURL=student.model.js.map
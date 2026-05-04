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
exports.FeeStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const feeStatusSchema = new mongoose_1.Schema({
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
    termId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Term',
        required: [true, 'Term is required'],
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'partial'],
        default: 'unpaid',
    },
    amountExpected: {
        type: Number,
        required: [true, 'Expected amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: [0, 'Amount cannot be negative'],
    },
    balance: {
        type: Number,
        default: 0,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Updated by is required'],
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index - one fee status per student per term
feeStatusSchema.index({ schoolId: 1, studentId: 1, termId: 1 }, { unique: true });
// Other indexes
feeStatusSchema.index({ schoolId: 1, termId: 1, status: 1 });
feeStatusSchema.index({ studentId: 1 });
// Calculate balance and update status before saving
feeStatusSchema.pre('save', function () {
    // Calculate balance
    this.balance = this.amountExpected - this.amountPaid;
    // Update status based on payment
    if (this.amountPaid >= this.amountExpected) {
        this.status = 'paid';
        this.balance = 0;
    }
    else if (this.amountPaid > 0) {
        this.status = 'partial';
    }
    else {
        this.status = 'unpaid';
    }
});
// Virtual for student
feeStatusSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for term
feeStatusSchema.virtual('term', {
    ref: 'Term',
    localField: 'termId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for updater
feeStatusSchema.virtual('updater', {
    ref: 'User',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true,
});
exports.FeeStatus = mongoose_1.default.model('FeeStatus', feeStatusSchema);
//# sourceMappingURL=fee-status.model.js.map
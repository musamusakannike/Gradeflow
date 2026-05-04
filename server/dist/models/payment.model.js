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
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const helpers_util_1 = require("../utils/helpers.util");
const paymentSchema = new mongoose_1.Schema({
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
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [100, 'Minimum payment is 100 NGN'],
    },
    reference: {
        type: String,
        required: [true, 'Reference is required'],
        unique: true,
    },
    paystackReference: {
        type: String,
        sparse: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'abandoned'],
        default: 'pending',
    },
    paidAt: {
        type: Date,
        default: null,
    },
    channel: {
        type: String,
        default: null,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
paymentSchema.index({ schoolId: 1, studentId: 1 });
paymentSchema.index({ schoolId: 1, termId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
// Generate reference before validation
paymentSchema.pre('validate', function () {
    if (!this.reference) {
        this.reference = `GF-${(0, helpers_util_1.generateId)()}`;
    }
});
// Virtual for student
paymentSchema.virtual('student', {
    ref: 'Student',
    localField: 'studentId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for term
paymentSchema.virtual('term', {
    ref: 'Term',
    localField: 'termId',
    foreignField: '_id',
    justOne: true,
});
exports.Payment = mongoose_1.default.model('Payment', paymentSchema);
//# sourceMappingURL=payment.model.js.map
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
exports.Subject = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const subjectSchema = new mongoose_1.Schema({
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School is required'],
    },
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true,
        maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        uppercase: true,
        trim: true,
        maxlength: [10, 'Subject code cannot exceed 10 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique indexes
subjectSchema.index({ schoolId: 1, name: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, isActive: 1 });
// Generate subject code from name if not provided
subjectSchema.pre('validate', function () {
    if (!this.code && this.name) {
        const words = this.name.split(' ');
        let code = '';
        if (words.length >= 2) {
            code = words.map((w) => w.charAt(0)).join('').toUpperCase();
        }
        else {
            code = this.name.substring(0, 3).toUpperCase();
        }
        this.code = code.substring(0, 10);
    }
});
exports.Subject = mongoose_1.default.model('Subject', subjectSchema);
//# sourceMappingURL=subject.model.js.map
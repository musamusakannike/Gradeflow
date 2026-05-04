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
exports.Class = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const classSchema = new mongoose_1.Schema({
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "School",
        required: [true, "School is required"],
    },
    name: {
        type: String,
        required: [true, "Class name is required"],
        trim: true,
        maxlength: [50, "Class name cannot exceed 50 characters"],
    },
    level: {
        type: Number,
        required: [true, "Class level is required"],
        min: [1, "Level must be at least 1"],
        max: [12, "Level cannot exceed 12"],
    },
    section: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: [5, "Section cannot exceed 5 characters"],
    },
    classTeacherId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    capacity: {
        type: Number,
        default: 50,
        min: [10, "Capacity must be at least 10"],
        max: [200, "Capacity cannot exceed 200"],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index for class name within a school
classSchema.index({ schoolId: 1, name: 1 }, { unique: true });
classSchema.index({ schoolId: 1, level: 1 });
// Virtual for class teacher
classSchema.virtual("classTeacher", {
    ref: "User",
    localField: "classTeacherId",
    foreignField: "_id",
    justOne: true,
});
// Virtual for students count
classSchema.virtual("studentsCount", {
    ref: "Student",
    localField: "_id",
    foreignField: "classId",
    count: true,
});
// Virtual for subjects
classSchema.virtual("subjects", {
    ref: "ClassSubject",
    localField: "_id",
    foreignField: "classId",
});
exports.Class = mongoose_1.default.model("Class", classSchema);
//# sourceMappingURL=class.model.js.map
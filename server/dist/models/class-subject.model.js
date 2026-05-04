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
exports.ClassSubject = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const classSubjectSchema = new mongoose_1.Schema({
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
    subjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Subject",
        required: [true, "Subject is required"],
    },
    teacherId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Teacher is required"],
    },
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Session",
        required: [true, "Session is required"],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound unique index - one subject per class per session
classSubjectSchema.index({ schoolId: 1, classId: 1, subjectId: 1, sessionId: 1 }, { unique: true });
// Other indexes
classSubjectSchema.index({ schoolId: 1, teacherId: 1 });
classSubjectSchema.index({ schoolId: 1, classId: 1 });
// Virtual for class
classSubjectSchema.virtual("class", {
    ref: "Class",
    localField: "classId",
    foreignField: "_id",
    justOne: true,
});
// Virtual for subject
classSubjectSchema.virtual("subject", {
    ref: "Subject",
    localField: "subjectId",
    foreignField: "_id",
    justOne: true,
});
// Virtual for teacher
classSubjectSchema.virtual("teacher", {
    ref: "User",
    localField: "teacherId",
    foreignField: "_id",
    justOne: true,
});
// Virtual for session
classSubjectSchema.virtual("session", {
    ref: "Session",
    localField: "sessionId",
    foreignField: "_id",
    justOne: true,
});
exports.ClassSubject = mongoose_1.default.model("ClassSubject", classSubjectSchema);
//# sourceMappingURL=class-subject.model.js.map
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
exports.getDashboardSummary = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const getDashboardSummary = async (user) => {
    const schoolId = user.schoolId;
    if (!schoolId) {
        return getSuperAdminDashboard();
    }
    switch (user.role) {
        case types_1.UserRole.SCHOOL_ADMIN:
            return getSchoolAdminDashboard(schoolId);
        case types_1.UserRole.TEACHER:
            return getTeacherDashboard(user._id, schoolId);
        case types_1.UserRole.BURSAR:
            return getBursarDashboard(schoolId);
        case types_1.UserRole.STUDENT:
            return getStudentDashboard(user._id, schoolId);
        case types_1.UserRole.PARENT:
            return getParentDashboard(user._id, schoolId);
        default:
            return {};
    }
};
exports.getDashboardSummary = getDashboardSummary;
const getSuperAdminDashboard = async () => {
    const [schools, users] = await Promise.all([
        Promise.resolve().then(() => __importStar(require("../models/school.model"))).then(({ School }) => School.countDocuments()),
        models_1.User.countDocuments(),
    ]);
    return { schools, users };
};
const getSchoolAdminDashboard = async (schoolId) => {
    const [students, staff, classes, subjects, currentSession, currentTerm, releasedResults, unpaidFees,] = await Promise.all([
        models_1.Student.countDocuments({ schoolId }),
        models_1.User.countDocuments({
            schoolId,
            role: { $in: [types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER, types_1.UserRole.BURSAR] },
        }),
        models_1.Class.countDocuments({ schoolId }),
        models_1.Subject.countDocuments({ schoolId, isActive: true }),
        models_1.Session.findOne({ schoolId, isCurrent: true }).select("name startYear endYear"),
        models_1.Term.findOne({ schoolId, isCurrent: true }).select("name termNumber"),
        models_1.ResultBatch.countDocuments({ schoolId, status: "released" }),
        models_1.FeeStatus.countDocuments({ schoolId, status: { $ne: "paid" } }),
    ]);
    return {
        counts: { students, staff, classes, subjects, releasedResults, unpaidFees },
        currentSession,
        currentTerm,
    };
};
const getTeacherDashboard = async (teacherId, schoolId) => {
    const assignments = await models_1.ClassSubject.find({ schoolId, teacherId })
        .populate("classId", "name level section")
        .populate("subjectId", "name code")
        .populate("sessionId", "name")
        .sort({ createdAt: -1 });
    const assignmentIds = assignments.map((assignment) => assignment._id);
    const [scoreCount, classTeacherOf] = await Promise.all([
        models_1.Score.countDocuments({ schoolId, classSubjectId: { $in: assignmentIds } }),
        models_1.Class.find({ schoolId, classTeacherId: teacherId }).select("name level section"),
    ]);
    return {
        counts: {
            assignedSubjects: assignments.length,
            classTeacherClasses: classTeacherOf.length,
            scoresEntered: scoreCount,
        },
        assignments,
        classTeacherOf,
    };
};
const getBursarDashboard = async (schoolId) => {
    const [feeStatuses, successfulPayments, pendingPayments] = await Promise.all([
        models_1.FeeStatus.find({ schoolId }).select("status amountExpected amountPaid balance"),
        models_1.Payment.find({ schoolId, status: "success" }).select("amount"),
        models_1.Payment.countDocuments({ schoolId, status: "pending" }),
    ]);
    const expected = feeStatuses.reduce((sum, fee) => sum + fee.amountExpected, 0);
    const collected = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
    return {
        counts: {
            paid: feeStatuses.filter((fee) => fee.status === "paid").length,
            partial: feeStatuses.filter((fee) => fee.status === "partial").length,
            unpaid: feeStatuses.filter((fee) => fee.status === "unpaid").length,
            pendingPayments,
        },
        finance: {
            expected,
            collected,
            outstanding: Math.max(expected - collected, 0),
        },
    };
};
const getStudentDashboard = async (userId, schoolId) => {
    const student = await models_1.Student.findOne({ userId, schoolId })
        .populate("class", "name level section")
        .select("studentId classId status");
    if (!student) {
        return { student: null };
    }
    const [fees, scores, releasedResults] = await Promise.all([
        models_1.FeeStatus.find({ schoolId, studentId: student._id })
            .populate("termId", "name termNumber")
            .sort({ createdAt: -1 }),
        models_1.Score.countDocuments({ schoolId, studentId: student._id }),
        models_1.ResultBatch.countDocuments({
            schoolId,
            classId: student.classId,
            status: "released",
        }),
    ]);
    return {
        student,
        counts: {
            scoreRecords: scores,
            releasedResults,
            unpaidTerms: fees.filter((fee) => fee.status !== "paid").length,
        },
        fees,
    };
};
const getParentDashboard = async (userId, schoolId) => {
    const children = await models_1.Student.find({
        parentUserId: userId,
        schoolId,
        status: "active",
    })
        .populate("user", "firstName lastName email")
        .populate("class", "name level section");
    const childIds = children.map((child) => child._id);
    const fees = await models_1.FeeStatus.find({
        schoolId,
        studentId: { $in: childIds },
    }).populate("termId", "name termNumber");
    return {
        counts: {
            children: children.length,
            unpaidTerms: fees.filter((fee) => fee.status !== "paid").length,
        },
        children,
        fees,
    };
};
//# sourceMappingURL=dashboard.service.js.map
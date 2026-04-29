"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGPA = exports.bulkEnterScores = exports.enterScores = exports.getSubjectResults = exports.getClassAnalytics = exports.getClassResults = exports.getStudentResult = exports.checkFeeStatus = exports.getResultBatchStatus = exports.unreleaseResultBatch = exports.releaseResultBatch = exports.compileResultBatch = void 0;
const score_model_1 = require("../models/score.model");
const student_model_1 = require("../models/student.model");
const fee_status_model_1 = require("../models/fee-status.model");
const class_subject_model_1 = require("../models/class-subject.model");
const term_model_1 = require("../models/term.model");
const class_model_1 = require("../models/class.model");
const user_model_1 = require("../models/user.model");
const result_batch_model_1 = require("../models/result-batch.model");
const school_model_1 = require("../models/school.model");
const errors_util_1 = require("../utils/errors.util");
const logger_util_1 = require("../utils/logger.util");
const helpers_util_1 = require("../utils/helpers.util");
const email_service_1 = require("./email.service");
const notification_service_1 = require("./notification.service");
const getReleasedBatch = async (classId, termId, schoolId) => {
    return result_batch_model_1.ResultBatch.findOne({
        classId,
        termId,
        schoolId,
        status: "released",
    });
};
const ensureResultIsEditable = async (classId, termId, schoolId) => {
    const released = await getReleasedBatch(classId, termId, schoolId);
    if (released) {
        throw new errors_util_1.ForbiddenError("Scores cannot be edited after results are released. Unrelease the result first.", "RESULT_RELEASED");
    }
};
const ensureTeacherOwnsAssignment = (classSubject, teacherId) => {
    if (!teacherId)
        return;
    if (classSubject.teacherId.toString() !== teacherId.toString()) {
        throw new errors_util_1.ForbiddenError("You can only access scores for subjects assigned to you", "UNASSIGNED_SUBJECT");
    }
};
const compileResultBatch = async (classId, termId, schoolId, compiledBy) => {
    const [classDoc, term] = await Promise.all([
        class_model_1.Class.findOne({ _id: classId, schoolId }),
        term_model_1.Term.findOne({ _id: termId, schoolId }),
    ]);
    if (!classDoc) {
        throw new errors_util_1.NotFoundError("Class not found");
    }
    if (!term) {
        throw new errors_util_1.NotFoundError("Term not found");
    }
    const existing = await result_batch_model_1.ResultBatch.findOne({ classId, termId, schoolId });
    if (existing?.status === "released") {
        throw new errors_util_1.ForbiddenError("Released results cannot be recompiled. Unrelease the result first.", "RESULT_RELEASED");
    }
    const [totalStudents, totalSubjects, totalScores] = await Promise.all([
        student_model_1.Student.countDocuments({ classId, schoolId, status: "active" }),
        class_subject_model_1.ClassSubject.countDocuments({
            classId,
            schoolId,
            sessionId: term.sessionId,
        }),
        score_model_1.Score.countDocuments({
            schoolId,
            termId,
            classSubjectId: {
                $in: await class_subject_model_1.ClassSubject.find({
                    classId,
                    schoolId,
                    sessionId: term.sessionId,
                }).distinct("_id"),
            },
        }),
    ]);
    if (totalStudents === 0) {
        throw new errors_util_1.BadRequestError("No active students found in this class");
    }
    if (totalSubjects === 0) {
        throw new errors_util_1.BadRequestError("No subjects assigned to this class for the session");
    }
    const batch = await result_batch_model_1.ResultBatch.findOneAndUpdate({ classId, termId, schoolId }, {
        $set: {
            status: "compiled",
            totalStudents,
            totalSubjects,
            totalScores,
            compiledBy,
            compiledAt: new Date(),
            releasedBy: null,
            releasedAt: null,
        },
    }, { new: true, upsert: true, runValidators: true });
    return batch;
};
exports.compileResultBatch = compileResultBatch;
const releaseResultBatch = async (classId, termId, schoolId, releasedBy) => {
    const batch = await result_batch_model_1.ResultBatch.findOne({ classId, termId, schoolId });
    if (!batch) {
        throw new errors_util_1.BadRequestError("Compile this class result before releasing it");
    }
    if (batch.status === "draft") {
        throw new errors_util_1.BadRequestError("Compile this class result before releasing it");
    }
    batch.status = "released";
    batch.releasedBy = releasedBy;
    batch.releasedAt = new Date();
    await batch.save();
    await notifyResultRelease(classId, termId, schoolId);
    return batch;
};
exports.releaseResultBatch = releaseResultBatch;
const unreleaseResultBatch = async (classId, termId, schoolId, unreleasedBy) => {
    const batch = await result_batch_model_1.ResultBatch.findOne({ classId, termId, schoolId });
    if (!batch) {
        throw new errors_util_1.NotFoundError("Result batch not found");
    }
    batch.status = "compiled";
    batch.unreleasedBy = unreleasedBy;
    batch.unreleasedAt = new Date();
    batch.releasedBy = undefined;
    batch.releasedAt = undefined;
    await batch.save();
    return batch;
};
exports.unreleaseResultBatch = unreleaseResultBatch;
const getResultBatchStatus = async (classId, termId, schoolId) => {
    const batch = await result_batch_model_1.ResultBatch.findOne({ classId, termId, schoolId })
        .populate("classId", "name level section")
        .populate("termId", "name termNumber");
    return (batch || {
        classId,
        termId,
        schoolId,
        status: "draft",
        totalStudents: 0,
        totalSubjects: 0,
        totalScores: 0,
    });
};
exports.getResultBatchStatus = getResultBatchStatus;
/**
 * Check if student has paid fees for a term
 */
const checkFeeStatus = async (studentId, termId, schoolId) => {
    const feeStatus = await fee_status_model_1.FeeStatus.findOne({
        studentId,
        termId,
        schoolId,
    });
    return feeStatus?.status === "paid";
};
exports.checkFeeStatus = checkFeeStatus;
/**
 * Get student result for a term
 */
const getStudentResult = async (studentId, termId, schoolId, checkFees = true) => {
    // Get student details
    const student = await student_model_1.Student.findOne({ _id: studentId, schoolId }).populate("userId");
    if (!student) {
        throw new errors_util_1.NotFoundError("Student not found");
    }
    const user = await user_model_1.User.findById(student.userId);
    if (!user) {
        throw new errors_util_1.NotFoundError("User not found");
    }
    // Check fee status if required
    if (checkFees) {
        const hasPaid = await (0, exports.checkFeeStatus)(studentId, termId, schoolId);
        if (!hasPaid) {
            throw new errors_util_1.ForbiddenError("Please pay your school fees to view results", "FEES_UNPAID");
        }
    }
    // Get term details
    const term = await term_model_1.Term.findById(termId);
    if (!term || term.schoolId.toString() !== schoolId.toString()) {
        throw new errors_util_1.NotFoundError("Term not found");
    }
    // Get class details
    const classDoc = await class_model_1.Class.findOne({ _id: student.classId, schoolId });
    if (!classDoc) {
        throw new errors_util_1.NotFoundError("Class not found");
    }
    if (checkFees) {
        const released = await getReleasedBatch(student.classId, termId, schoolId);
        if (!released) {
            throw new errors_util_1.ForbiddenError("Results have not been released for this term", "RESULT_NOT_RELEASED");
        }
    }
    // Get all scores for the student in this term
    const scores = await score_model_1.Score.find({
        studentId,
        termId,
        schoolId,
    }).populate({
        path: "classSubjectId",
        populate: [
            { path: "subjectId", select: "name code" },
            { path: "teacherId", select: "firstName lastName" },
        ],
    });
    // Format subject results
    const subjects = scores.map((score) => {
        const classSubject = score.classSubjectId;
        return {
            name: classSubject.subjectId.name,
            code: classSubject.subjectId.code,
            test1: score.test1,
            test2: score.test2,
            exam: score.exam,
            total: score.total,
            grade: score.grade,
            remark: score.remark,
            teacher: `${classSubject.teacherId.firstName} ${classSubject.teacherId.lastName}`,
        };
    });
    // Calculate summary
    const totalSubjects = subjects.length;
    const totalScore = subjects.reduce((sum, s) => sum + s.total, 0);
    const averageScore = totalSubjects > 0 ? totalScore / totalSubjects : 0;
    return {
        student: {
            id: student._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            studentId: student.studentId,
        },
        term: {
            id: term._id.toString(),
            name: term.name,
        },
        class: {
            id: classDoc._id.toString(),
            name: classDoc.name,
        },
        subjects,
        summary: {
            totalSubjects,
            totalScore,
            averageScore: Math.round(averageScore * 100) / 100,
        },
    };
};
exports.getStudentResult = getStudentResult;
/**
 * Get class results for a term
 */
const getClassResults = async (classId, termId, schoolId) => {
    // Get all students in the class
    const students = await student_model_1.Student.find({
        classId,
        schoolId,
        status: "active",
    });
    const results = [];
    const averages = [];
    for (const student of students) {
        try {
            const result = await (0, exports.getStudentResult)(student._id, termId, schoolId, false);
            results.push(result);
            averages.push(result.summary.averageScore);
        }
        catch (error) {
            logger_util_1.logger.warn(`Could not get result for student ${student._id}:`, error);
        }
    }
    // Sort by average score descending
    results.sort((a, b) => b.summary.averageScore - a.summary.averageScore);
    // Add positions
    results.forEach((result, index) => {
        result.summary.position = index + 1;
        result.summary.classSize = results.length;
    });
    // Calculate class statistics
    const classStats = {
        totalStudents: results.length,
        highestAverage: averages.length > 0 ? Math.max(...averages) : 0,
        lowestAverage: averages.length > 0 ? Math.min(...averages) : 0,
        classAverage: averages.length > 0
            ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100
            : 0,
    };
    return { results, classStats };
};
exports.getClassResults = getClassResults;
const getClassAnalytics = async (classId, termId, schoolId) => {
    const classSubjectIds = await class_subject_model_1.ClassSubject.find({ classId, schoolId })
        .distinct("_id");
    const scores = await score_model_1.Score.find({
        schoolId,
        termId,
        classSubjectId: { $in: classSubjectIds },
    }).populate({
        path: "classSubjectId",
        populate: { path: "subjectId", select: "name code" },
    });
    const totals = scores.map((score) => score.total);
    const passed = scores.filter((score) => score.total >= 50).length;
    const failed = scores.length - passed;
    const bySubjectMap = new Map();
    for (const score of scores) {
        const classSubject = score.classSubjectId;
        const key = classSubject.subjectId.code;
        const current = bySubjectMap.get(key) ||
            {
                subject: classSubject.subjectId.name,
                code: classSubject.subjectId.code,
                scores: [],
                passed: 0,
            };
        current.scores.push(score.total);
        if (score.total >= 50)
            current.passed += 1;
        bySubjectMap.set(key, current);
    }
    const bySubject = Array.from(bySubjectMap.values()).map((item) => ({
        subject: item.subject,
        code: item.code,
        totalScores: item.scores.length,
        averageScore: item.scores.length > 0
            ? Math.round((item.scores.reduce((sum, score) => sum + score, 0) /
                item.scores.length) *
                100) / 100
            : 0,
        highestScore: item.scores.length > 0 ? Math.max(...item.scores) : 0,
        lowestScore: item.scores.length > 0 ? Math.min(...item.scores) : 0,
        passRate: item.scores.length > 0
            ? Math.round((item.passed / item.scores.length) * 10000) / 100
            : 0,
    }));
    return {
        totals: {
            totalScores: scores.length,
            averageScore: totals.length > 0
                ? Math.round((totals.reduce((sum, score) => sum + score, 0) / totals.length) *
                    100) / 100
                : 0,
            highestScore: totals.length > 0 ? Math.max(...totals) : 0,
            lowestScore: totals.length > 0 ? Math.min(...totals) : 0,
            passCount: passed,
            failCount: failed,
            passRate: scores.length > 0 ? Math.round((passed / scores.length) * 10000) / 100 : 0,
        },
        bySubject,
    };
};
exports.getClassAnalytics = getClassAnalytics;
const notifyResultRelease = async (classId, termId, schoolId) => {
    try {
        const [school, term, students] = await Promise.all([
            school_model_1.School.findById(schoolId).select("name"),
            term_model_1.Term.findById(termId).select("name"),
            student_model_1.Student.find({ classId, schoolId, status: "active" })
                .populate("userId", "email firstName")
                .populate("parentUserId", "email firstName"),
        ]);
        await Promise.all(students.map(async (student) => {
            const user = student.userId;
            const parent = student.parentUserId;
            await Promise.all([
                (0, notification_service_1.sendResultNotification)(student._id, term?.name || "Term"),
                user?.email
                    ? (0, email_service_1.sendResultNotificationEmail)(user.email, user.firstName || "Student", term?.name || "Term", school?.name || "School")
                    : Promise.resolve(false),
                parent?.email
                    ? (0, email_service_1.sendResultNotificationEmail)(parent.email, parent.firstName || "Parent", term?.name || "Term", school?.name || "School")
                    : Promise.resolve(false),
            ]);
        }));
    }
    catch (error) {
        logger_util_1.logger.error("Failed to send result release notifications:", error);
    }
};
/**
 * Get subject results for a class
 */
const getSubjectResults = async (classSubjectId, termId, schoolId, teacherId) => {
    const classSubject = await class_subject_model_1.ClassSubject.findOne({
        _id: classSubjectId,
        schoolId,
    });
    if (!classSubject) {
        throw new errors_util_1.NotFoundError("Class subject not found");
    }
    ensureTeacherOwnsAssignment(classSubject, teacherId);
    const term = await term_model_1.Term.findOne({ _id: termId, schoolId });
    if (!term) {
        throw new errors_util_1.NotFoundError("Term not found");
    }
    const scores = await score_model_1.Score.find({
        classSubjectId,
        termId,
        schoolId,
    }).populate({
        path: "studentId",
        populate: { path: "userId", select: "firstName lastName" },
    });
    const formattedScores = scores.map((score) => {
        const student = score.studentId;
        return {
            student: {
                id: student._id.toString(),
                name: `${student.userId.firstName} ${student.userId.lastName}`,
                studentId: student.studentId,
            },
            test1: score.test1,
            test2: score.test2,
            exam: score.exam,
            total: score.total,
            grade: score.grade,
            remark: score.remark,
        };
    });
    // Sort by total descending
    formattedScores.sort((a, b) => b.total - a.total);
    // Calculate statistics
    const totals = formattedScores.map((s) => s.total);
    const passed = formattedScores.filter((s) => s.total >= 50).length;
    const stats = {
        totalStudents: formattedScores.length,
        highestScore: totals.length > 0 ? Math.max(...totals) : 0,
        lowestScore: totals.length > 0 ? Math.min(...totals) : 0,
        averageScore: totals.length > 0
            ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100
            : 0,
        passRate: formattedScores.length > 0
            ? Math.round((passed / formattedScores.length) * 100 * 100) / 100
            : 0,
    };
    return { scores: formattedScores, stats };
};
exports.getSubjectResults = getSubjectResults;
/**
 * Enter or update scores
 */
const enterScores = async (data, schoolId, teacherId) => {
    // Verify student exists and belongs to school
    const student = await student_model_1.Student.findOne({ _id: data.studentId, schoolId });
    if (!student) {
        throw new errors_util_1.NotFoundError("Student not found");
    }
    // Verify class subject exists
    const classSubject = await class_subject_model_1.ClassSubject.findOne({
        _id: data.classSubjectId,
        schoolId,
    });
    if (!classSubject) {
        throw new errors_util_1.NotFoundError("Class subject not found");
    }
    const term = await term_model_1.Term.findOne({ _id: data.termId, schoolId });
    if (!term) {
        throw new errors_util_1.NotFoundError("Term not found");
    }
    ensureTeacherOwnsAssignment(classSubject, teacherId);
    if (student.classId.toString() !== classSubject.classId.toString()) {
        throw new errors_util_1.BadRequestError("Student does not belong to this class subject's class");
    }
    await ensureResultIsEditable(classSubject.classId, data.termId, schoolId);
    // Find existing score or create new
    let score = await score_model_1.Score.findOne({
        studentId: data.studentId,
        classSubjectId: data.classSubjectId,
        termId: data.termId,
        schoolId,
    });
    if (score) {
        // Update existing score
        if (data.test1 !== undefined)
            score.test1 = data.test1;
        if (data.test2 !== undefined)
            score.test2 = data.test2;
        if (data.exam !== undefined)
            score.exam = data.exam;
        await score.save();
    }
    else {
        // Create new score
        score = await score_model_1.Score.create({
            schoolId,
            studentId: data.studentId,
            classSubjectId: data.classSubjectId,
            termId: data.termId,
            test1: data.test1 || 0,
            test2: data.test2 || 0,
            exam: data.exam || 0,
        });
    }
    return score;
};
exports.enterScores = enterScores;
/**
 * Bulk enter scores for a class subject
 */
const bulkEnterScores = async (classSubjectId, termId, scores, schoolId, teacherId) => {
    const result = {
        updated: 0,
        created: 0,
        errors: [],
    };
    const classSubject = await class_subject_model_1.ClassSubject.findOne({
        _id: classSubjectId,
        schoolId,
    });
    if (!classSubject) {
        throw new errors_util_1.NotFoundError("Class subject not found");
    }
    ensureTeacherOwnsAssignment(classSubject, teacherId);
    const term = await term_model_1.Term.findOne({ _id: termId, schoolId });
    if (!term) {
        throw new errors_util_1.NotFoundError("Term not found");
    }
    await ensureResultIsEditable(classSubject.classId, termId, schoolId);
    for (const scoreData of scores) {
        try {
            const student = await student_model_1.Student.findOne({
                _id: scoreData.studentId,
                schoolId,
            });
            if (!student) {
                throw new errors_util_1.NotFoundError("Student not found");
            }
            if (student.classId.toString() !== classSubject.classId.toString()) {
                throw new errors_util_1.BadRequestError("Student does not belong to this class subject's class");
            }
            const existing = await score_model_1.Score.findOne({
                studentId: scoreData.studentId,
                classSubjectId,
                termId,
                schoolId,
            });
            if (existing) {
                if (scoreData.test1 !== undefined)
                    existing.test1 = scoreData.test1;
                if (scoreData.test2 !== undefined)
                    existing.test2 = scoreData.test2;
                if (scoreData.exam !== undefined)
                    existing.exam = scoreData.exam;
                await existing.save();
                result.updated++;
            }
            else {
                await score_model_1.Score.create({
                    schoolId,
                    studentId: scoreData.studentId,
                    classSubjectId,
                    termId,
                    test1: scoreData.test1 || 0,
                    test2: scoreData.test2 || 0,
                    exam: scoreData.exam || 0,
                });
                result.created++;
            }
        }
        catch (error) {
            result.errors.push(`Error for student ${scoreData.studentId}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    return result;
};
exports.bulkEnterScores = bulkEnterScores;
/**
 * Calculate GPA for a student
 */
const calculateGPA = async (studentId, termId, schoolId) => {
    const scores = await score_model_1.Score.find({ studentId, termId, schoolId });
    if (scores.length === 0)
        return 0;
    const totalPoints = scores.reduce((sum, score) => sum + (0, helpers_util_1.getGradePoint)(score.grade), 0);
    return Math.round((totalPoints / scores.length) * 100) / 100;
};
exports.calculateGPA = calculateGPA;
//# sourceMappingURL=result.service.js.map
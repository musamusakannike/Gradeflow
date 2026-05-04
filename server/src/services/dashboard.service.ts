import { Types } from "mongoose";
import {
  Class,
  ClassSubject,
  FeeStatus,
  Payment,
  ResultBatch,
  Score,
  Session,
  Student,
  Subject,
  Term,
  User,
} from "../models";
import { UserRole } from "../types";

export const getDashboardSummary = async (
  user: {
    _id: Types.ObjectId;
    role: UserRole;
    schoolId?: Types.ObjectId;
  },
) => {
  const schoolId = user.schoolId;

  if (!schoolId) {
    return getSuperAdminDashboard();
  }

  switch (user.role) {
    case UserRole.SCHOOL_ADMIN:
      return getSchoolAdminDashboard(schoolId);
    case UserRole.TEACHER:
      return getTeacherDashboard(user._id, schoolId);
    case UserRole.BURSAR:
      return getBursarDashboard(schoolId);
    case UserRole.STUDENT:
      return getStudentDashboard(user._id, schoolId);
    case UserRole.PARENT:
      return getParentDashboard(user._id, schoolId);
    default:
      return {};
  }
};

const getSuperAdminDashboard = async () => {
  const [schools, users] = await Promise.all([
    import("../models/school.model").then(({ School }) => School.countDocuments()),
    User.countDocuments(),
  ]);

  return { schools, users };
};

const getSchoolAdminDashboard = async (schoolId: Types.ObjectId) => {
  const [
    students,
    staff,
    classes,
    subjects,
    currentSession,
    currentTerm,
    releasedResults,
    unpaidFees,
  ] = await Promise.all([
    Student.countDocuments({ schoolId }),
    User.countDocuments({
      schoolId,
      role: { $in: [UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.BURSAR] },
    }),
    Class.countDocuments({ schoolId }),
    Subject.countDocuments({ schoolId, isActive: true }),
    Session.findOne({ schoolId, isCurrent: true }).select("name startYear endYear"),
    Term.findOne({ schoolId, isCurrent: true }).select("name termNumber"),
    ResultBatch.countDocuments({ schoolId, status: "released" }),
    FeeStatus.countDocuments({ schoolId, status: { $ne: "paid" } }),
  ]);

  return {
    counts: { students, staff, classes, subjects, releasedResults, unpaidFees },
    currentSession,
    currentTerm,
  };
};

const getTeacherDashboard = async (
  teacherId: Types.ObjectId,
  schoolId: Types.ObjectId,
) => {
  const assignments = await ClassSubject.find({ schoolId, teacherId })
    .populate("classId", "name level section")
    .populate("subjectId", "name code")
    .populate("sessionId", "name")
    .sort({ createdAt: -1 });

  const assignmentIds = assignments.map((assignment) => assignment._id);
  const [scoreCount, classTeacherOf] = await Promise.all([
    Score.countDocuments({ schoolId, classSubjectId: { $in: assignmentIds } }),
    Class.find({ schoolId, classTeacherId: teacherId }).select("name level section"),
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

const getBursarDashboard = async (schoolId: Types.ObjectId) => {
  const [feeStatuses, successfulPayments, pendingPayments] = await Promise.all([
    FeeStatus.find({ schoolId }).select("status amountExpected amountPaid balance"),
    Payment.find({ schoolId, status: "success" }).select("amount"),
    Payment.countDocuments({ schoolId, status: "pending" }),
  ]);

  const expected = feeStatuses.reduce((sum, fee) => sum + fee.amountExpected, 0);
  const collected = successfulPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

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

const getStudentDashboard = async (
  userId: Types.ObjectId,
  schoolId: Types.ObjectId,
) => {
  const student = await Student.findOne({ userId, schoolId })
    .populate("class", "name level section")
    .select("studentId classId status");

  if (!student) {
    return { student: null };
  }

  const [fees, scores, releasedResults] = await Promise.all([
    FeeStatus.find({ schoolId, studentId: student._id })
      .populate("termId", "name termNumber")
      .sort({ createdAt: -1 }),
    Score.countDocuments({ schoolId, studentId: student._id }),
    ResultBatch.countDocuments({
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

const getParentDashboard = async (
  userId: Types.ObjectId,
  schoolId: Types.ObjectId,
) => {
  const children = await Student.find({
    parentUserId: userId,
    schoolId,
    status: "active",
  })
    .populate("user", "firstName lastName email")
    .populate("class", "name level section");

  const childIds = children.map((child) => child._id);
  const fees = await FeeStatus.find({
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

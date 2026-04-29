import { Types } from "mongoose";
import { Score } from "../models/score.model";
import { Student } from "../models/student.model";
import { FeeStatus } from "../models/fee-status.model";
import { ClassSubject } from "../models/class-subject.model";
import { Term } from "../models/term.model";
import { Class } from "../models/class.model";
import { User } from "../models/user.model";
import { ResultBatch } from "../models/result-batch.model";
import { ResultSummary } from "../types";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors.util";
import { logger } from "../utils/logger.util";
import { getGradePoint } from "../utils/helpers.util";

const getReleasedBatch = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
) => {
  return ResultBatch.findOne({
    classId,
    termId,
    schoolId,
    status: "released",
  });
};

const ensureResultIsEditable = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<void> => {
  const released = await getReleasedBatch(classId, termId, schoolId);
  if (released) {
    throw new ForbiddenError(
      "Scores cannot be edited after results are released. Unrelease the result first.",
      "RESULT_RELEASED",
    );
  }
};

const ensureTeacherOwnsAssignment = (
  classSubject: InstanceType<typeof ClassSubject>,
  teacherId?: Types.ObjectId,
): void => {
  if (!teacherId) return;

  if (classSubject.teacherId.toString() !== teacherId.toString()) {
    throw new ForbiddenError(
      "You can only access scores for subjects assigned to you",
      "UNASSIGNED_SUBJECT",
    );
  }
};

export const compileResultBatch = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
  compiledBy: Types.ObjectId,
) => {
  const [classDoc, term] = await Promise.all([
    Class.findOne({ _id: classId, schoolId }),
    Term.findOne({ _id: termId, schoolId }),
  ]);

  if (!classDoc) {
    throw new NotFoundError("Class not found");
  }

  if (!term) {
    throw new NotFoundError("Term not found");
  }

  const existing = await ResultBatch.findOne({ classId, termId, schoolId });
  if (existing?.status === "released") {
    throw new ForbiddenError(
      "Released results cannot be recompiled. Unrelease the result first.",
      "RESULT_RELEASED",
    );
  }

  const [totalStudents, totalSubjects, totalScores] = await Promise.all([
    Student.countDocuments({ classId, schoolId, status: "active" }),
    ClassSubject.countDocuments({
      classId,
      schoolId,
      sessionId: term.sessionId,
    }),
    Score.countDocuments({
      schoolId,
      termId,
      classSubjectId: {
        $in: await ClassSubject.find({
          classId,
          schoolId,
          sessionId: term.sessionId,
        }).distinct("_id"),
      },
    }),
  ]);

  if (totalStudents === 0) {
    throw new BadRequestError("No active students found in this class");
  }

  if (totalSubjects === 0) {
    throw new BadRequestError("No subjects assigned to this class for the session");
  }

  const batch = await ResultBatch.findOneAndUpdate(
    { classId, termId, schoolId },
    {
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
    },
    { new: true, upsert: true, runValidators: true },
  );

  return batch;
};

export const releaseResultBatch = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
  releasedBy: Types.ObjectId,
) => {
  const batch = await ResultBatch.findOne({ classId, termId, schoolId });

  if (!batch) {
    throw new BadRequestError("Compile this class result before releasing it");
  }

  if (batch.status === "draft") {
    throw new BadRequestError("Compile this class result before releasing it");
  }

  batch.status = "released";
  batch.releasedBy = releasedBy;
  batch.releasedAt = new Date();
  await batch.save();

  return batch;
};

export const unreleaseResultBatch = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
  unreleasedBy: Types.ObjectId,
) => {
  const batch = await ResultBatch.findOne({ classId, termId, schoolId });

  if (!batch) {
    throw new NotFoundError("Result batch not found");
  }

  batch.status = "compiled";
  batch.unreleasedBy = unreleasedBy;
  batch.unreleasedAt = new Date();
  batch.releasedBy = undefined;
  batch.releasedAt = undefined;
  await batch.save();

  return batch;
};

export const getResultBatchStatus = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
) => {
  const batch = await ResultBatch.findOne({ classId, termId, schoolId })
    .populate("classId", "name level section")
    .populate("termId", "name termNumber");

  return (
    batch || {
      classId,
      termId,
      schoolId,
      status: "draft",
      totalStudents: 0,
      totalSubjects: 0,
      totalScores: 0,
    }
  );
};

/**
 * Check if student has paid fees for a term
 */
export const checkFeeStatus = async (
  studentId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<boolean> => {
  const feeStatus = await FeeStatus.findOne({
    studentId,
    termId,
    schoolId,
  });

  return feeStatus?.status === "paid";
};

/**
 * Get student result for a term
 */
export const getStudentResult = async (
  studentId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
  checkFees: boolean = true,
): Promise<ResultSummary> => {
  // Get student details
  const student = await Student.findOne({ _id: studentId, schoolId }).populate("userId");
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  const user = await User.findById(student.userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check fee status if required
  if (checkFees) {
    const hasPaid = await checkFeeStatus(studentId, termId, schoolId);
    if (!hasPaid) {
      throw new ForbiddenError(
        "Please pay your school fees to view results",
        "FEES_UNPAID",
      );
    }
  }

  // Get term details
  const term = await Term.findById(termId);
  if (!term || term.schoolId.toString() !== schoolId.toString()) {
    throw new NotFoundError("Term not found");
  }

  // Get class details
  const classDoc = await Class.findOne({ _id: student.classId, schoolId });
  if (!classDoc) {
    throw new NotFoundError("Class not found");
  }

  if (checkFees) {
    const released = await getReleasedBatch(
      student.classId as Types.ObjectId,
      termId,
      schoolId,
    );
    if (!released) {
      throw new ForbiddenError(
        "Results have not been released for this term",
        "RESULT_NOT_RELEASED",
      );
    }
  }

  // Get all scores for the student in this term
  const scores = await Score.find({
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
    const classSubject = score.classSubjectId as unknown as {
      subjectId: { name: string; code: string };
      teacherId: { firstName: string; lastName: string };
    };

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

/**
 * Get class results for a term
 */
export const getClassResults = async (
  classId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<{
  results: ResultSummary[];
  classStats: {
    totalStudents: number;
    highestAverage: number;
    lowestAverage: number;
    classAverage: number;
  };
}> => {
  // Get all students in the class
  const students = await Student.find({
    classId,
    schoolId,
    status: "active",
  });

  const results: ResultSummary[] = [];
  const averages: number[] = [];

  for (const student of students) {
    try {
      const result = await getStudentResult(
        student._id as Types.ObjectId,
        termId,
        schoolId,
        false, // Don't check fees for class-level results
      );
      results.push(result);
      averages.push(result.summary.averageScore);
    } catch (error) {
      logger.warn(`Could not get result for student ${student._id}:`, error);
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
    classAverage:
      averages.length > 0
        ? Math.round(
            (averages.reduce((a, b) => a + b, 0) / averages.length) * 100,
          ) / 100
        : 0,
  };

  return { results, classStats };
};

/**
 * Get subject results for a class
 */
export const getSubjectResults = async (
  classSubjectId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
  teacherId?: Types.ObjectId,
): Promise<{
  scores: Array<{
    student: { id: string; name: string; studentId: string };
    test1: number;
    test2: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
  }>;
  stats: {
    totalStudents: number;
    highestScore: number;
    lowestScore: number;
    averageScore: number;
    passRate: number;
  };
}> => {
  const classSubject = await ClassSubject.findOne({
    _id: classSubjectId,
    schoolId,
  });

  if (!classSubject) {
    throw new NotFoundError("Class subject not found");
  }

  ensureTeacherOwnsAssignment(classSubject, teacherId);

  const term = await Term.findOne({ _id: termId, schoolId });
  if (!term) {
    throw new NotFoundError("Term not found");
  }

  const scores = await Score.find({
    classSubjectId,
    termId,
    schoolId,
  }).populate({
    path: "studentId",
    populate: { path: "userId", select: "firstName lastName" },
  });

  const formattedScores = scores.map((score) => {
    const student = score.studentId as unknown as {
      _id: Types.ObjectId;
      studentId: string;
      userId: { firstName: string; lastName: string };
    };

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
    averageScore:
      totals.length > 0
        ? Math.round(
            (totals.reduce((a, b) => a + b, 0) / totals.length) * 100,
          ) / 100
        : 0,
    passRate:
      formattedScores.length > 0
        ? Math.round((passed / formattedScores.length) * 100 * 100) / 100
        : 0,
  };

  return { scores: formattedScores, stats };
};

/**
 * Enter or update scores
 */
export const enterScores = async (
  data: {
    studentId: Types.ObjectId;
    classSubjectId: Types.ObjectId;
    termId: Types.ObjectId;
    test1?: number;
    test2?: number;
    exam?: number;
  },
  schoolId: Types.ObjectId,
  teacherId?: Types.ObjectId,
): Promise<InstanceType<typeof Score>> => {
  // Verify student exists and belongs to school
  const student = await Student.findOne({ _id: data.studentId, schoolId });
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  // Verify class subject exists
  const classSubject = await ClassSubject.findOne({
    _id: data.classSubjectId,
    schoolId,
  });
  if (!classSubject) {
    throw new NotFoundError("Class subject not found");
  }

  const term = await Term.findOne({ _id: data.termId, schoolId });
  if (!term) {
    throw new NotFoundError("Term not found");
  }

  ensureTeacherOwnsAssignment(classSubject, teacherId);

  if (student.classId.toString() !== classSubject.classId.toString()) {
    throw new BadRequestError("Student does not belong to this class subject's class");
  }

  await ensureResultIsEditable(
    classSubject.classId as Types.ObjectId,
    data.termId,
    schoolId,
  );

  // Find existing score or create new
  let score = await Score.findOne({
    studentId: data.studentId,
    classSubjectId: data.classSubjectId,
    termId: data.termId,
    schoolId,
  });

  if (score) {
    // Update existing score
    if (data.test1 !== undefined) score.test1 = data.test1;
    if (data.test2 !== undefined) score.test2 = data.test2;
    if (data.exam !== undefined) score.exam = data.exam;
    await score.save();
  } else {
    // Create new score
    score = await Score.create({
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

/**
 * Bulk enter scores for a class subject
 */
export const bulkEnterScores = async (
  classSubjectId: Types.ObjectId,
  termId: Types.ObjectId,
  scores: Array<{
    studentId: Types.ObjectId;
    test1?: number;
    test2?: number;
    exam?: number;
  }>,
  schoolId: Types.ObjectId,
  teacherId?: Types.ObjectId,
): Promise<{ updated: number; created: number; errors: string[] }> => {
  const result = {
    updated: 0,
    created: 0,
    errors: [] as string[],
  };

  const classSubject = await ClassSubject.findOne({
    _id: classSubjectId,
    schoolId,
  });

  if (!classSubject) {
    throw new NotFoundError("Class subject not found");
  }

  ensureTeacherOwnsAssignment(classSubject, teacherId);

  const term = await Term.findOne({ _id: termId, schoolId });
  if (!term) {
    throw new NotFoundError("Term not found");
  }

  await ensureResultIsEditable(
    classSubject.classId as Types.ObjectId,
    termId,
    schoolId,
  );

  for (const scoreData of scores) {
    try {
      const student = await Student.findOne({
        _id: scoreData.studentId,
        schoolId,
      });

      if (!student) {
        throw new NotFoundError("Student not found");
      }

      if (student.classId.toString() !== classSubject.classId.toString()) {
        throw new BadRequestError(
          "Student does not belong to this class subject's class",
        );
      }

      const existing = await Score.findOne({
        studentId: scoreData.studentId,
        classSubjectId,
        termId,
        schoolId,
      });

      if (existing) {
        if (scoreData.test1 !== undefined) existing.test1 = scoreData.test1;
        if (scoreData.test2 !== undefined) existing.test2 = scoreData.test2;
        if (scoreData.exam !== undefined) existing.exam = scoreData.exam;
        await existing.save();
        result.updated++;
      } else {
        await Score.create({
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
    } catch (error) {
      result.errors.push(
        `Error for student ${scoreData.studentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return result;
};

/**
 * Calculate GPA for a student
 */
export const calculateGPA = async (
  studentId: Types.ObjectId,
  termId: Types.ObjectId,
  schoolId: Types.ObjectId,
): Promise<number> => {
  const scores = await Score.find({ studentId, termId, schoolId });

  if (scores.length === 0) return 0;

  const totalPoints = scores.reduce(
    (sum, score) => sum + getGradePoint(score.grade),
    0,
  );
  return Math.round((totalPoints / scores.length) * 100) / 100;
};

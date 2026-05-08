export type Role =
  | "school_admin"
  | "teacher"
  | "bursar"
  | "student"
  | "parent"
  | "super_admin";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  schoolId?: string;
};

export type Student = {
  _id: string;
  studentId: string;
  status: string;
  parentName: string;
  parentEmail?: string;
  parentPhone: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  class?: {
    _id: string;
    name: string;
    level: number;
    section?: string;
  };
};

export type ResultSubject = {
  name: string;
  code: string;
  test1: number;
  test2: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
  teacher: string;
};

export type AcademicSession = {
  _id: string;
  name: string;           // e.g. "2024/2025"
  startYear: number;
  isCurrent: boolean;
};

export type AcademicTerm = {
  _id: string;
  name: string;           // "First Term" | "Second Term" | "Third Term"
  startDate: string;      // ISO date string "YYYY-MM-DD"
  endDate: string;
  isCurrent: boolean;
  sessionId: string;
};

export type DashboardSummary = {
  counts: {
    students: number;
    staff: number;
    unpaidFees: number;
    releasedResults: number;
  };
  currentSession: { _id: string; name: string } | null;
  currentTerm: { _id: string; name: string } | null;
};

export type FeeStats = {
  totalExpected: number;
  totalCollected: number;
  outstandingCount: number;
};

export type StudentOption = {
  _id: string;
  studentId: string;
  displayName: string;    // "First Last (GFS/2026/0194)"
};

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "teacher";
  status: "active" | "inactive" | "suspended";
}

export interface SchoolClass {
  id: string;
  name: string;
  level: number;
  section?: string;
  capacity: number;
  classTeacherId?: string;
  classTeacher?: { firstName: string; lastName: string };
  studentsCount?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Assignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  sessionId: string;
  class?: { name: string };
  subject?: { name: string; code: string };
  teacher?: { firstName: string; lastName: string };
}

export interface ClassSubjectOption {
  _id: string;
  classId: string | { _id: string; name: string };
  subjectId: string | { _id: string; name: string; code: string };
  teacherId: string | { _id: string; firstName: string; lastName: string };
  sessionId: string;
  class?: { _id: string; name: string };
  subject?: { _id: string; name: string; code: string };
  teacher?: { _id: string; firstName: string; lastName: string };
  displayLabel?: string;
}

export interface ScoreRow {
  studentId: string;
  studentName: string;
  studentCode: string;
  test1: number;
  test2: number;
  exam: number;
  total?: number;
  grade?: string;
  remark?: string;
}

export interface ResultSummaryFull {
  student: {
    id: string;
    name: string;
    studentId: string;
  };
  term: {
    id: string;
    name: string;
  };
  class: {
    id: string;
    name: string;
  };
  subjects: ResultSubject[];
  summary: {
    totalSubjects: number;
    totalScore: number;
    averageScore: number;
    position?: number;
    classSize?: number;
  };
}

export interface ClassAnalytics {
  totals: {
    totalScores: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    failCount: number;
    passRate: number;
  };
  bySubject: Array<{
    subject: string;
    code: string;
    totalScores: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }>;
}

export interface ClassBroadsheet {
  results: ResultSummaryFull[];
  classStats: {
    totalStudents: number;
    highestAverage: number;
    lowestAverage: number;
    classAverage: number;
  };
}

export interface StudentDetail {
  _id: string;
  studentId: string;
  status: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  parentName: string;
  parentEmail?: string;
  parentPhone: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  class?: {
    _id: string;
    name: string;
    level: number;
    section?: string;
  };
}

export interface FeeStatusEntry {
  termId: string;
  termName: string;
  amountExpected: number;
  amountPaid: number;
  balance: number;
  status: "paid" | "partial" | "unpaid";
}

export interface FeeStatusResponse {
  studentId: string;
  feeStatuses: FeeStatusEntry[];
}

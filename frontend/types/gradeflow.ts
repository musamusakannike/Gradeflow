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

export type DashboardSummary = Record<string, unknown>;

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

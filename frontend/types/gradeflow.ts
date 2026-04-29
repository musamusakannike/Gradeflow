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

import { Request } from 'express';
import { Types } from 'mongoose';

// User Roles
export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'bursar' | 'student';

// User Status
export type UserStatus = 'active' | 'inactive' | 'suspended';

// Student Status
export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'expelled' | 'withdrawn';

// Term Number
export type TermNumber = 1 | 2 | 3;

// Fee Status
export type FeeStatusType = 'paid' | 'unpaid' | 'partial';

// Payment Status
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned';

// Score Types
export type AssessmentType = 'test1' | 'test2' | 'exam';

// Gender
export type Gender = 'male' | 'female';

// Authenticated User in Request
export interface AuthUser {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  schoolId?: Types.ObjectId;
}

// Extended Express Request with Auth
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  schoolId?: Types.ObjectId;
}

// Pagination Query
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Base Document Interface
export interface BaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// School Document
export interface ISchool extends BaseDocument {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  motto?: string;
  established?: number;
  isActive: boolean;
  settings: {
    maxStudentsPerClass: number;
    gradingScale: 'default' | 'custom';
    customGrades?: Array<{
      min: number;
      max: number;
      grade: string;
      remark: string;
    }>;
    resultReleaseMode: 'automatic' | 'manual';
  };
}

// User Document
export interface IUser extends BaseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  schoolId?: Types.ObjectId;
  status: UserStatus;
  avatar?: string;
  expoPushToken?: string;
  googleId?: string;
  emailVerified: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

// Student Document
export interface IStudent extends BaseDocument {
  userId: Types.ObjectId;
  schoolId: Types.ObjectId;
  studentId: string;
  classId: Types.ObjectId;
  dateOfBirth: Date;
  gender: Gender;
  address?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  admissionDate: Date;
  status: StudentStatus;
}

// Academic Session Document
export interface ISession extends BaseDocument {
  schoolId: Types.ObjectId;
  name: string;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
}

// Term Document
export interface ITerm extends BaseDocument {
  schoolId: Types.ObjectId;
  sessionId: Types.ObjectId;
  name: string;
  termNumber: TermNumber;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

// Class Document
export interface IClass extends BaseDocument {
  schoolId: Types.ObjectId;
  name: string;
  level: number;
  section?: string;
  classTeacherId?: Types.ObjectId;
  capacity: number;
}

// Subject Document
export interface ISubject extends BaseDocument {
  schoolId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

// Class Subject Assignment
export interface IClassSubject extends BaseDocument {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  sessionId: Types.ObjectId;
}

// Score Document
export interface IScore extends BaseDocument {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  termId: Types.ObjectId;
  test1: number;
  test2: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

// Fee Status Document
export interface IFeeStatus extends BaseDocument {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  termId: Types.ObjectId;
  status: FeeStatusType;
  amountExpected: number;
  amountPaid: number;
  balance: number;
  updatedBy: Types.ObjectId;
  notes?: string;
}

// Payment Document
export interface IPayment extends BaseDocument {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  termId: Types.ObjectId;
  amount: number;
  reference: string;
  paystackReference?: string;
  status: PaymentStatus;
  paidAt?: Date;
  channel?: string;
  metadata?: Record<string, unknown>;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  type: 'access' | 'refresh';
}

// Login Response
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
    avatar?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Result Summary
export interface ResultSummary {
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
  subjects: Array<{
    name: string;
    code: string;
    test1: number;
    test2: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
    teacher: string;
  }>;
  summary: {
    totalSubjects: number;
    totalScore: number;
    averageScore: number;
    position?: number;
    classSize?: number;
  };
}

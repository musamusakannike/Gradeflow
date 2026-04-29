import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generate a unique ID with optional prefix
 */
export const generateId = (prefix?: string): string => {
  const uuid = uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase();
  return prefix ? `${prefix}${uuid}` : uuid;
};

/**
 * Generate a student ID number
 */
export const generateStudentId = (schoolCode: string, year: number): string => {
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${schoolCode}/${year}/${randomPart}`;
};

/**
 * Generate a staff ID number
 */
export const generateStaffId = (schoolCode: string, role: string): string => {
  const rolePrefix = role.substring(0, 3).toUpperCase();
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${schoolCode}/${rolePrefix}/${randomPart}`;
};

/**
 * Generate a random password
 */
export const generatePassword = (length: number = 12): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 10): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
};

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Generate a verification code
 */
export const generateVerificationCode = (length: number = 6): string => {
  return Math.random()
    .toString()
    .substring(2, 2 + length);
};

/**
 * Generate a secure token
 */
export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString("hex");
};

/**
 * Calculate grade from total score (Nigerian grading scale)
 */
export const calculateGrade = (
  score: number,
): { grade: string; remark: string } => {
  if (score >= 75) return { grade: "A", remark: "Excellent" };
  if (score >= 70) return { grade: "B+", remark: "Very Good" };
  if (score >= 65) return { grade: "B", remark: "Good" };
  if (score >= 60) return { grade: "C+", remark: "Credit" };
  if (score >= 55) return { grade: "C", remark: "Credit" };
  if (score >= 50) return { grade: "D", remark: "Pass" };
  if (score >= 45) return { grade: "E", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
};

/**
 * Calculate grade point from grade
 */
export const getGradePoint = (grade: string): number => {
  const gradePoints: Record<string, number> = {
    A: 5.0,
    "B+": 4.5,
    B: 4.0,
    "C+": 3.5,
    C: 3.0,
    D: 2.0,
    E: 1.0,
    F: 0.0,
  };
  return gradePoints[grade] || 0;
};

/**
 * Format Nigerian currency
 */
export const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

/**
 * Parse pagination parameters
 */
export const parsePagination = (
  page?: string | number,
  limit?: string | number,
): { page: number; limit: number; skip: number } => {
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  return { page: parsedPage, limit: parsedLimit, skip };
};

/**
 * Sanitize filename for storage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const ext = getFileExtension(originalName);
  const uniqueId = generateId();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}.${ext}`;
};

/**
 * Mask sensitive data
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  const maskedLocal = local.substring(0, 2) + "***";
  return `${maskedLocal}@${domain}`;
};

/**
 * Validate Nigerian phone number
 */
export const isValidNigerianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  // Nigerian phone numbers: 0803xxxxxxx or +234803xxxxxxx
  return /^(0|234|\+234)?[789][01]\d{8}$/.test(cleaned);
};

/**
 * Format Nigerian phone number
 */
export const formatNigerianPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("234")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0")) {
    return `+234${cleaned.substring(1)}`;
  }
  return `+234${cleaned}`;
};

/**
 * Get academic session format
 */
export const formatAcademicSession = (startYear: number): string => {
  return `${startYear}/${startYear + 1}`;
};

/**
 * Get term label
 */
export const getTermLabel = (term: number): string => {
  const terms: Record<number, string> = {
    1: "First Term",
    2: "Second Term",
    3: "Third Term",
  };
  return terms[term] || `Term ${term}`;
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTermLabel = exports.formatAcademicSession = exports.formatNigerianPhone = exports.isValidNigerianPhone = exports.maskEmail = exports.generateUniqueFilename = exports.getFileExtension = exports.sanitizeFilename = exports.parsePagination = exports.formatNaira = exports.getGradePoint = exports.calculateGrade = exports.generateSecureToken = exports.generateVerificationCode = exports.hashPassword = exports.generateSecurePassword = exports.generatePassword = exports.generateStaffId = exports.generateStudentId = exports.generateId = void 0;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Generate a unique ID with optional prefix
 */
const generateId = (prefix) => {
    const uuid = (0, uuid_1.v4)().replace(/-/g, "").substring(0, 12).toUpperCase();
    return prefix ? `${prefix}${uuid}` : uuid;
};
exports.generateId = generateId;
/**
 * Generate a student ID number
 */
const generateStudentId = (schoolCode, year) => {
    const randomPart = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${schoolCode}/${year}/${randomPart}`;
};
exports.generateStudentId = generateStudentId;
/**
 * Generate a staff ID number
 */
const generateStaffId = (schoolCode, role) => {
    const rolePrefix = role.substring(0, 3).toUpperCase();
    const randomPart = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
    return `${schoolCode}/${rolePrefix}/${randomPart}`;
};
exports.generateStaffId = generateStaffId;
/**
 * Generate a random password
 */
const generatePassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};
exports.generatePassword = generatePassword;
/**
 * Generate a secure random password
 */
const generateSecurePassword = (length = 10) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const bytes = crypto_1.default.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length];
    }
    return password;
};
exports.generateSecurePassword = generateSecurePassword;
/**
 * Hash a password
 */
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Generate a verification code
 */
const generateVerificationCode = (length = 6) => {
    return Math.random()
        .toString()
        .substring(2, 2 + length);
};
exports.generateVerificationCode = generateVerificationCode;
/**
 * Generate a secure token
 */
const generateSecureToken = (bytes = 32) => {
    return crypto_1.default.randomBytes(bytes).toString("hex");
};
exports.generateSecureToken = generateSecureToken;
/**
 * Calculate grade from total score (Nigerian grading scale)
 */
const calculateGrade = (score) => {
    if (score >= 75)
        return { grade: "A", remark: "Excellent" };
    if (score >= 70)
        return { grade: "B+", remark: "Very Good" };
    if (score >= 65)
        return { grade: "B", remark: "Good" };
    if (score >= 60)
        return { grade: "C+", remark: "Credit" };
    if (score >= 55)
        return { grade: "C", remark: "Credit" };
    if (score >= 50)
        return { grade: "D", remark: "Pass" };
    if (score >= 45)
        return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
};
exports.calculateGrade = calculateGrade;
/**
 * Calculate grade point from grade
 */
const getGradePoint = (grade) => {
    const gradePoints = {
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
exports.getGradePoint = getGradePoint;
/**
 * Format Nigerian currency
 */
const formatNaira = (amount) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
    }).format(amount);
};
exports.formatNaira = formatNaira;
/**
 * Parse pagination parameters
 */
const parsePagination = (page, limit) => {
    const parsedPage = Math.max(1, parseInt(String(page)) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
    const skip = (parsedPage - 1) * parsedLimit;
    return { page: parsedPage, limit: parsedLimit, skip };
};
exports.parsePagination = parsePagination;
/**
 * Sanitize filename for storage
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_{2,}/g, "_")
        .toLowerCase();
};
exports.sanitizeFilename = sanitizeFilename;
/**
 * Get file extension
 */
const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};
exports.getFileExtension = getFileExtension;
/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalName) => {
    const ext = (0, exports.getFileExtension)(originalName);
    const uniqueId = (0, exports.generateId)();
    const timestamp = Date.now();
    return `${timestamp}-${uniqueId}.${ext}`;
};
exports.generateUniqueFilename = generateUniqueFilename;
/**
 * Mask sensitive data
 */
const maskEmail = (email) => {
    const [local, domain] = email.split("@");
    const maskedLocal = local.substring(0, 2) + "***";
    return `${maskedLocal}@${domain}`;
};
exports.maskEmail = maskEmail;
/**
 * Validate Nigerian phone number
 */
const isValidNigerianPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    // Nigerian phone numbers: 0803xxxxxxx or +234803xxxxxxx
    return /^(0|234|\+234)?[789][01]\d{8}$/.test(cleaned);
};
exports.isValidNigerianPhone = isValidNigerianPhone;
/**
 * Format Nigerian phone number
 */
const formatNigerianPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("234")) {
        return `+${cleaned}`;
    }
    if (cleaned.startsWith("0")) {
        return `+234${cleaned.substring(1)}`;
    }
    return `+234${cleaned}`;
};
exports.formatNigerianPhone = formatNigerianPhone;
/**
 * Get academic session format
 */
const formatAcademicSession = (startYear) => {
    return `${startYear}/${startYear + 1}`;
};
exports.formatAcademicSession = formatAcademicSession;
/**
 * Get term label
 */
const getTermLabel = (term) => {
    const terms = {
        1: "First Term",
        2: "Second Term",
        3: "Third Term",
    };
    return terms[term] || `Term ${term}`;
};
exports.getTermLabel = getTermLabel;
//# sourceMappingURL=helpers.util.js.map
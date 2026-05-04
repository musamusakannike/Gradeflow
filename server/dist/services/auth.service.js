"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePushToken = exports.getUserProfile = exports.createStudentUser = exports.createStaffUser = exports.changePassword = exports.resetPassword = exports.requestPasswordReset = exports.refreshAccessToken = exports.loginWithGoogle = exports.login = exports.registerSchool = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const school_model_1 = require("../models/school.model");
const student_model_1 = require("../models/student.model");
const errors_util_1 = require("../utils/errors.util");
const helpers_util_1 = require("../utils/helpers.util");
const firebase_config_1 = require("../config/firebase.config");
const email_service_1 = require("./email.service");
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
/**
 * Generate access and refresh tokens
 */
const generateTokens = (user) => {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        schoolId: user.schoolId?.toString(),
    };
    const accessToken = jsonwebtoken_1.default.sign({ ...payload, type: "access" }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ ...payload, type: "refresh" }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    // Calculate expiry in seconds
    const expiresIn = typeof JWT_EXPIRES_IN === "string"
        ? parseInt(JWT_EXPIRES_IN) *
            (JWT_EXPIRES_IN.includes("d")
                ? 86400
                : JWT_EXPIRES_IN.includes("h")
                    ? 3600
                    : 1)
        : 604800; // 7 days default
    return { accessToken, refreshToken, expiresIn };
};
exports.generateTokens = generateTokens;
/**
 * Format user response
 */
const formatUserResponse = (user) => ({
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId?.toString(),
    avatar: user.avatar || undefined,
});
/**
 * Register a new school with admin
 */
const registerSchool = async (data) => {
    // Check if school email already exists
    const existingSchool = await school_model_1.School.findOne({
        email: data.schoolEmail.toLowerCase(),
    });
    if (existingSchool) {
        throw new errors_util_1.ConflictError("School with this email already exists");
    }
    // Check if admin email already exists
    const existingUser = await user_model_1.User.findOne({
        email: data.adminEmail.toLowerCase(),
    });
    if (existingUser) {
        throw new errors_util_1.ConflictError("User with this email already exists");
    }
    if (data.schoolCode) {
        const existingCode = await school_model_1.School.findOne({
            code: data.schoolCode.toUpperCase(),
        });
        if (existingCode) {
            throw new errors_util_1.ConflictError("School with this code already exists");
        }
    }
    // Create school
    const school = await school_model_1.School.create({
        name: data.schoolName,
        code: data.schoolCode?.toUpperCase(),
        email: data.schoolEmail.toLowerCase(),
        phone: data.schoolPhone,
        address: data.schoolAddress,
        city: data.city,
        state: data.state,
    });
    // Create school admin
    const admin = await user_model_1.User.create({
        email: data.adminEmail.toLowerCase(),
        password: data.adminPassword,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        phone: data.adminPhone,
        role: "school_admin",
        schoolId: school._id,
        emailVerified: false,
    });
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    // Send welcome email
    await (0, email_service_1.sendWelcomeEmail)(admin.email, admin.firstName, school.name);
    const tokens = (0, exports.generateTokens)(admin);
    return {
        user: formatUserResponse(admin),
        tokens,
    };
};
exports.registerSchool = registerSchool;
/**
 * Login with email and password
 */
const login = async (email, password) => {
    // Find user with password
    const user = await user_model_1.User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
        throw new errors_util_1.UnauthorizedError("Invalid email or password");
    }
    if (user.status !== "active") {
        throw new errors_util_1.UnauthorizedError("Account is not active");
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new errors_util_1.UnauthorizedError("Invalid email or password");
    }
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    const tokens = (0, exports.generateTokens)(user);
    return {
        user: formatUserResponse(user),
        tokens,
    };
};
exports.login = login;
/**
 * Login with Google
 */
const loginWithGoogle = async (idToken, schoolId) => {
    const decoded = await (0, firebase_config_1.verifyGoogleToken)(idToken);
    if (!decoded) {
        throw new errors_util_1.UnauthorizedError("Invalid Google token");
    }
    const { email, name, picture, uid } = decoded;
    if (!email) {
        throw new errors_util_1.BadRequestError("Email not provided by Google");
    }
    // Find existing user
    let user = await user_model_1.User.findOne({
        $or: [{ email: email.toLowerCase() }, { googleId: uid }],
    });
    if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
            user.googleId = uid;
        }
        user.emailVerified = true;
        user.lastLogin = new Date();
        if (picture && !user.avatar) {
            user.avatar = picture;
        }
        await user.save();
    }
    else {
        // For new users via Google, we need a school context
        if (!schoolId) {
            throw new errors_util_1.BadRequestError("School ID required for new Google sign-ups");
        }
        // Verify school exists
        const school = await school_model_1.School.findOne({
            $or: [
                { code: schoolId.toUpperCase() },
                ...(mongoose_1.Types.ObjectId.isValid(schoolId) ? [{ _id: schoolId }] : []),
            ],
        });
        if (!school || !school.isActive) {
            throw new errors_util_1.NotFoundError("School not found or inactive");
        }
        // Parse name
        const nameParts = (name || "User").split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "";
        // Create new user (default role: student)
        user = await user_model_1.User.create({
            email: email.toLowerCase(),
            password: (0, helpers_util_1.generatePassword)(16), // Random password since using Google
            firstName,
            lastName,
            googleId: uid,
            avatar: picture,
            role: "student",
            schoolId: school._id,
            emailVerified: true,
            lastLogin: new Date(),
        });
    }
    if (user.status !== "active") {
        throw new errors_util_1.UnauthorizedError("Account is not active");
    }
    const tokens = (0, exports.generateTokens)(user);
    return {
        user: formatUserResponse(user),
        tokens,
    };
};
exports.loginWithGoogle = loginWithGoogle;
/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        if (decoded.type !== "refresh") {
            throw new errors_util_1.UnauthorizedError("Invalid token type");
        }
        const user = await user_model_1.User.findById(decoded.userId);
        if (!user || user.status !== "active") {
            throw new errors_util_1.UnauthorizedError("User not found or inactive");
        }
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            schoolId: user.schoolId?.toString(),
        };
        const accessToken = jsonwebtoken_1.default.sign({ ...payload, type: "access" }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        const expiresIn = typeof JWT_EXPIRES_IN === "string"
            ? parseInt(JWT_EXPIRES_IN) *
                (JWT_EXPIRES_IN.includes("d")
                    ? 86400
                    : JWT_EXPIRES_IN.includes("h")
                        ? 3600
                        : 1)
            : 604800;
        return { accessToken, expiresIn };
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_util_1.UnauthorizedError("Invalid refresh token");
        }
        throw error;
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Request password reset
 */
const requestPasswordReset = async (email) => {
    const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
    // Don't reveal if user exists
    if (!user) {
        return;
    }
    // Generate reset token
    const resetToken = (0, helpers_util_1.generateSecureToken)();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();
    // Send reset email
    await (0, email_service_1.sendPasswordResetEmail)(user.email, user.firstName, resetToken);
};
exports.requestPasswordReset = requestPasswordReset;
/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword) => {
    const user = await user_model_1.User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");
    if (!user) {
        throw new errors_util_1.BadRequestError("Invalid or expired reset token");
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
};
exports.resetPassword = resetPassword;
/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await user_model_1.User.findById(userId).select("+password");
    if (!user) {
        throw new errors_util_1.NotFoundError("User not found");
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new errors_util_1.UnauthorizedError("Current password is incorrect");
    }
    user.password = newPassword;
    await user.save();
};
exports.changePassword = changePassword;
/**
 * Create a staff user (teacher, bursar)
 */
const createStaffUser = async (data, schoolId, createdBy) => {
    // Check if email already exists
    const existingUser = await user_model_1.User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
        throw new errors_util_1.ConflictError("User with this email already exists");
    }
    // Generate temporary password
    const tempPassword = (0, helpers_util_1.generatePassword)(10);
    const user = await user_model_1.User.create({
        email: data.email.toLowerCase(),
        password: tempPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        schoolId,
        status: "active",
        emailVerified: false,
    });
    // Get school name for email
    const school = await school_model_1.School.findById(schoolId);
    // Send credentials email
    await (0, email_service_1.sendWelcomeEmail)(user.email, user.firstName, school?.name || "GradeFlow", tempPassword);
    return user;
};
exports.createStaffUser = createStaffUser;
/**
 * Create a student user
 */
const createStudentUser = async (data, schoolId) => {
    // Check if email already exists
    const existingUser = await user_model_1.User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
        throw new errors_util_1.ConflictError("User with this email already exists");
    }
    // Get school for code
    const school = await school_model_1.School.findById(schoolId);
    if (!school) {
        throw new errors_util_1.NotFoundError("School not found");
    }
    // Generate temporary password
    const tempPassword = (0, helpers_util_1.generatePassword)(10);
    // Generate student ID
    const studentId = (0, helpers_util_1.generateStudentId)(school.code, new Date().getFullYear());
    // Create user
    const user = await user_model_1.User.create({
        email: data.email.toLowerCase(),
        password: tempPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: "student",
        schoolId,
        status: "active",
        emailVerified: false,
    });
    // Create student profile
    const student = await student_model_1.Student.create({
        userId: user._id,
        schoolId,
        studentId,
        classId: data.classId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        admissionDate: new Date(),
        status: "active",
    });
    // Send credentials email
    await (0, email_service_1.sendWelcomeEmail)(user.email, user.firstName, school.name, tempPassword);
    return { user, student };
};
exports.createStudentUser = createStudentUser;
/**
 * Get user profile
 */
const getUserProfile = async (userId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new errors_util_1.NotFoundError("User not found");
    }
    return formatUserResponse(user);
};
exports.getUserProfile = getUserProfile;
/**
 * Update user push token
 */
const updatePushToken = async (userId, pushToken) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new errors_util_1.NotFoundError("User not found");
    }
    user.expoPushToken = pushToken;
    await user.save();
};
exports.updatePushToken = updatePushToken;
//# sourceMappingURL=auth.service.js.map
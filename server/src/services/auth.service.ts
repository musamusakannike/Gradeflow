import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { User, UserDocument } from "../models/user.model";
import { School } from "../models/school.model";
import { Student } from "../models/student.model";
import { JWTPayload, LoginResponse, UserRole } from "../types/index";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../utils/errors.util";
import {
  generateSecureToken,
  generatePassword,
  generateStudentId,
} from "../utils/helpers.util";
import { verifyGoogleToken } from "../config/firebase.config";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email.service";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "default-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

/**
 * Generate access and refresh tokens
 */
export const generateTokens = (
  user: UserDocument,
): { accessToken: string; refreshToken: string; expiresIn: number } => {
  const payload: Omit<JWTPayload, "type"> = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    schoolId: user.schoolId?.toString(),
  };

  const accessToken = jwt.sign({ ...payload, type: "access" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as any },
  );

  // Calculate expiry in seconds
  const expiresIn =
    typeof JWT_EXPIRES_IN === "string"
      ? parseInt(JWT_EXPIRES_IN) *
        (JWT_EXPIRES_IN.includes("d")
          ? 86400
          : JWT_EXPIRES_IN.includes("h")
            ? 3600
            : 1)
      : 604800; // 7 days default

  return { accessToken, refreshToken, expiresIn };
};

/**
 * Format user response
 */
const formatUserResponse = (user: UserDocument): LoginResponse["user"] => ({
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
export const registerSchool = async (data: {
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  city: string;
  state: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}): Promise<LoginResponse> => {
  // Check if school email already exists
  const existingSchool = await School.findOne({
    email: data.schoolEmail.toLowerCase(),
  });
  if (existingSchool) {
    throw new ConflictError("School with this email already exists");
  }

  // Check if admin email already exists
  const existingUser = await User.findOne({
    email: data.adminEmail.toLowerCase(),
  });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Create school
  const school = await School.create({
    name: data.schoolName,
    email: data.schoolEmail.toLowerCase(),
    phone: data.schoolPhone,
    address: data.schoolAddress,
    city: data.city,
    state: data.state,
  });

  // Create school admin
  const admin = await User.create({
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
  await sendWelcomeEmail(admin.email, admin.firstName, school.name);

  const tokens = generateTokens(admin);

  return {
    user: formatUserResponse(admin),
    tokens,
  };
};

/**
 * Login with email and password
 */
export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  // Find user with password
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const tokens = generateTokens(user);

  return {
    user: formatUserResponse(user),
    tokens,
  };
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (
  idToken: string,
  schoolId?: string,
): Promise<LoginResponse> => {
  const decoded = await verifyGoogleToken(idToken);

  if (!decoded) {
    throw new UnauthorizedError("Invalid Google token");
  }

  const { email, name, picture, uid } = decoded;

  if (!email) {
    throw new BadRequestError("Email not provided by Google");
  }

  // Find existing user
  let user = await User.findOne({
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
  } else {
    // For new users via Google, we need a school context
    if (!schoolId) {
      throw new BadRequestError("School ID required for new Google sign-ups");
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school || !school.isActive) {
      throw new NotFoundError("School not found or inactive");
    }

    // Parse name
    const nameParts = (name || "User").split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Create new user (default role: student)
    user = await User.create({
      email: email.toLowerCase(),
      password: generatePassword(16), // Random password since using Google
      firstName,
      lastName,
      googleId: uid,
      avatar: picture,
      role: "student",
      schoolId,
      emailVerified: true,
      lastLogin: new Date(),
    });
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Account is not active");
  }

  const tokens = generateTokens(user);

  return {
    user: formatUserResponse(user),
    tokens,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; expiresIn: number }> => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;

    if (decoded.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.status !== "active") {
      throw new UnauthorizedError("User not found or inactive");
    }

    const payload: Omit<JWTPayload, "type"> = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId?.toString(),
    };

    const accessToken = jwt.sign({ ...payload, type: "access" }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    const expiresIn =
      typeof JWT_EXPIRES_IN === "string"
        ? parseInt(JWT_EXPIRES_IN) *
          (JWT_EXPIRES_IN.includes("d")
            ? 86400
            : JWT_EXPIRES_IN.includes("h")
              ? 3600
              : 1)
        : 604800;

    return { accessToken, expiresIn };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid refresh token");
    }
    throw error;
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Don't reveal if user exists
  if (!user) {
    return;
  }

  // Generate reset token
  const resetToken = generateSecureToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetExpires;
  await user.save();

  // Send reset email
  await sendPasswordResetEmail(user.email, user.firstName, resetToken);
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new BadRequestError("Invalid or expired reset token");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

/**
 * Change password
 */
export const changePassword = async (
  userId: Types.ObjectId,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
};

/**
 * Create a staff user (teacher, bursar)
 */
export const createStaffUser = async (
  data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  },
  schoolId: Types.ObjectId,
  createdBy: Types.ObjectId,
): Promise<UserDocument> => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Generate temporary password
  const tempPassword = generatePassword(10);

  const user = await User.create({
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
  const school = await School.findById(schoolId);

  // Send credentials email
  await sendWelcomeEmail(
    user.email,
    user.firstName,
    school?.name || "GradeFlow",
    tempPassword,
  );

  return user;
};

/**
 * Create a student user
 */
export const createStudentUser = async (
  data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth: Date;
    gender: "male" | "female";
    address?: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    classId: Types.ObjectId;
  },
  schoolId: Types.ObjectId,
): Promise<{ user: UserDocument; student: InstanceType<typeof Student> }> => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Get school for code
  const school = await School.findById(schoolId);
  if (!school) {
    throw new NotFoundError("School not found");
  }

  // Generate temporary password
  const tempPassword = generatePassword(10);

  // Generate student ID
  const studentId = generateStudentId(school.code, new Date().getFullYear());

  // Create user
  const user = await User.create({
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
  const student = await Student.create({
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
  await sendWelcomeEmail(user.email, user.firstName, school.name, tempPassword);

  return { user, student };
};

import { ExpoPushMessage } from "expo-server-sdk";
import { Types } from "mongoose";
import {
  sendPushNotifications,
  isValidExpoPushToken,
  PushNotificationResult,
} from "../config/expo.config";
import { User } from "../models/user.model";
import { Student } from "../models/student.model";
import { logger } from "../utils/logger.util";

interface NotificationData {
  type: string;
  [key: string]: unknown;
}

/**
 * Send push notification to a single user
 */
export const sendToUser = async (
  userId: Types.ObjectId,
  title: string,
  body: string,
  data?: NotificationData,
): Promise<boolean> => {
  const user = await User.findById(userId).select("expoPushToken");

  if (!user?.expoPushToken || !isValidExpoPushToken(user.expoPushToken)) {
    logger.warn("User has no valid push token:", userId);
    return false;
  }

  const message: ExpoPushMessage = {
    to: user.expoPushToken,
    title,
    body,
    data: data || {},
    sound: "default",
  };

  const result = await sendPushNotifications([message]);
  return result.successful.length > 0;
};

/**
 * Send push notification to multiple users
 */
export const sendToUsers = async (
  userIds: Types.ObjectId[],
  title: string,
  body: string,
  data?: NotificationData,
): Promise<PushNotificationResult> => {
  const users = await User.find({
    _id: { $in: userIds },
    expoPushToken: { $exists: true, $ne: null },
  }).select("expoPushToken");

  const messages: ExpoPushMessage[] = users
    .filter(
      (user) => user.expoPushToken && isValidExpoPushToken(user.expoPushToken),
    )
    .map((user) => ({
      to: user.expoPushToken!,
      title,
      body,
      data: data || {},
      sound: "default" as const,
    }));

  if (messages.length === 0) {
    return { successful: [], failed: [] };
  }

  return sendPushNotifications(messages);
};

/**
 * Send notification to all students in a class
 */
export const sendToClass = async (
  classId: Types.ObjectId,
  schoolId: Types.ObjectId,
  title: string,
  body: string,
  data?: NotificationData,
): Promise<PushNotificationResult> => {
  const students = await Student.find({
    classId,
    schoolId,
    status: "active",
  }).select("userId");

  const userIds = students.map((s) => s.userId as Types.ObjectId);
  return sendToUsers(userIds, title, body, data);
};

/**
 * Send notification to all users with a specific role in a school
 */
export const sendToRole = async (
  schoolId: Types.ObjectId,
  role: string,
  title: string,
  body: string,
  data?: NotificationData,
): Promise<PushNotificationResult> => {
  const users = await User.find({
    schoolId,
    role,
    status: "active",
    expoPushToken: { $exists: true, $ne: null },
  }).select("_id");

  const userIds = users.map((u) => u._id as Types.ObjectId);
  return sendToUsers(userIds, title, body, data);
};

/**
 * Send notification to all staff in a school
 */
export const sendToAllStaff = async (
  schoolId: Types.ObjectId,
  title: string,
  body: string,
  data?: NotificationData,
): Promise<PushNotificationResult> => {
  const users = await User.find({
    schoolId,
    role: { $in: ["school_admin", "teacher", "bursar"] },
    status: "active",
    expoPushToken: { $exists: true, $ne: null },
  }).select("_id");

  const userIds = users.map((u) => u._id as Types.ObjectId);
  return sendToUsers(userIds, title, body, data);
};

/**
 * Send result release notification
 */
export const sendResultNotification = async (
  studentId: Types.ObjectId,
  termName: string,
): Promise<boolean> => {
  const student = await Student.findById(studentId).select("userId");
  if (!student) return false;

  return sendToUser(
    student.userId as Types.ObjectId,
    "Results Available",
    `Your ${termName} results are now available. Log in to view them.`,
    { type: "result_release", termName },
  );
};

/**
 * Send fee reminder notification
 */
export const sendFeeReminder = async (
  studentId: Types.ObjectId,
  termName: string,
  amount: number,
): Promise<boolean> => {
  const student = await Student.findById(studentId).select("userId");
  if (!student) return false;

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

  return sendToUser(
    student.userId as Types.ObjectId,
    "Fee Payment Reminder",
    `Your school fee for ${termName} (${formattedAmount}) is pending. Please make payment to access your results.`,
    { type: "fee_reminder", termName, amount },
  );
};

/**
 * Send payment confirmation notification
 */
export const sendPaymentConfirmation = async (
  studentId: Types.ObjectId,
  amount: number,
  reference: string,
): Promise<boolean> => {
  const student = await Student.findById(studentId).select("userId");
  if (!student) return false;

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

  return sendToUser(
    student.userId as Types.ObjectId,
    "Payment Confirmed",
    `Your payment of ${formattedAmount} has been confirmed. Reference: ${reference}`,
    { type: "payment_confirmation", amount, reference },
  );
};

/**
 * Send score update notification
 */
export const sendScoreUpdateNotification = async (
  studentId: Types.ObjectId,
  subjectName: string,
): Promise<boolean> => {
  const student = await Student.findById(studentId).select("userId");
  if (!student) return false;

  return sendToUser(
    student.userId as Types.ObjectId,
    "Score Updated",
    `Your score for ${subjectName} has been updated.`,
    { type: "score_update", subjectName },
  );
};

/**
 * Register push token for a user
 */
export const registerPushToken = async (
  userId: Types.ObjectId,
  token: string,
): Promise<boolean> => {
  if (!isValidExpoPushToken(token)) {
    logger.warn("Invalid Expo push token:", token);
    return false;
  }

  await User.findByIdAndUpdate(userId, { expoPushToken: token });
  logger.info("Push token registered for user:", userId);
  return true;
};

/**
 * Remove push token for a user
 */
export const removePushToken = async (
  userId: Types.ObjectId,
): Promise<void> => {
  await User.findByIdAndUpdate(userId, { $unset: { expoPushToken: 1 } });
  logger.info("Push token removed for user:", userId);
};

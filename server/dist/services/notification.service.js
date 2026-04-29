"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePushToken = exports.registerPushToken = exports.sendScoreUpdateNotification = exports.sendPaymentConfirmation = exports.sendFeeReminder = exports.sendResultNotification = exports.sendToAllStaff = exports.sendToRole = exports.sendToClass = exports.sendToUsers = exports.sendToUser = void 0;
const expo_config_1 = require("../config/expo.config");
const user_model_1 = require("../models/user.model");
const student_model_1 = require("../models/student.model");
const logger_util_1 = require("../utils/logger.util");
/**
 * Send push notification to a single user
 */
const sendToUser = async (userId, title, body, data) => {
    const user = await user_model_1.User.findById(userId).select("expoPushToken");
    if (!user?.expoPushToken || !(0, expo_config_1.isValidExpoPushToken)(user.expoPushToken)) {
        logger_util_1.logger.warn("User has no valid push token:", userId);
        return false;
    }
    const message = {
        to: user.expoPushToken,
        title,
        body,
        data: data || {},
        sound: "default",
    };
    const result = await (0, expo_config_1.sendPushNotifications)([message]);
    return result.successful.length > 0;
};
exports.sendToUser = sendToUser;
/**
 * Send push notification to multiple users
 */
const sendToUsers = async (userIds, title, body, data) => {
    const users = await user_model_1.User.find({
        _id: { $in: userIds },
        expoPushToken: { $exists: true, $ne: null },
    }).select("expoPushToken");
    const messages = users
        .filter((user) => user.expoPushToken && (0, expo_config_1.isValidExpoPushToken)(user.expoPushToken))
        .map((user) => ({
        to: user.expoPushToken,
        title,
        body,
        data: data || {},
        sound: "default",
    }));
    if (messages.length === 0) {
        return { successful: [], failed: [] };
    }
    return (0, expo_config_1.sendPushNotifications)(messages);
};
exports.sendToUsers = sendToUsers;
/**
 * Send notification to all students in a class
 */
const sendToClass = async (classId, schoolId, title, body, data) => {
    const students = await student_model_1.Student.find({
        classId,
        schoolId,
        status: "active",
    }).select("userId");
    const userIds = students.map((s) => s.userId);
    return (0, exports.sendToUsers)(userIds, title, body, data);
};
exports.sendToClass = sendToClass;
/**
 * Send notification to all users with a specific role in a school
 */
const sendToRole = async (schoolId, role, title, body, data) => {
    const users = await user_model_1.User.find({
        schoolId,
        role,
        status: "active",
        expoPushToken: { $exists: true, $ne: null },
    }).select("_id");
    const userIds = users.map((u) => u._id);
    return (0, exports.sendToUsers)(userIds, title, body, data);
};
exports.sendToRole = sendToRole;
/**
 * Send notification to all staff in a school
 */
const sendToAllStaff = async (schoolId, title, body, data) => {
    const users = await user_model_1.User.find({
        schoolId,
        role: { $in: ["school_admin", "teacher", "bursar"] },
        status: "active",
        expoPushToken: { $exists: true, $ne: null },
    }).select("_id");
    const userIds = users.map((u) => u._id);
    return (0, exports.sendToUsers)(userIds, title, body, data);
};
exports.sendToAllStaff = sendToAllStaff;
/**
 * Send result release notification
 */
const sendResultNotification = async (studentId, termName) => {
    const student = await student_model_1.Student.findById(studentId).select("userId");
    if (!student)
        return false;
    return (0, exports.sendToUser)(student.userId, "Results Available", `Your ${termName} results are now available. Log in to view them.`, { type: "result_release", termName });
};
exports.sendResultNotification = sendResultNotification;
/**
 * Send fee reminder notification
 */
const sendFeeReminder = async (studentId, termName, amount) => {
    const student = await student_model_1.Student.findById(studentId).select("userId");
    if (!student)
        return false;
    const formattedAmount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
    }).format(amount);
    return (0, exports.sendToUser)(student.userId, "Fee Payment Reminder", `Your school fee for ${termName} (${formattedAmount}) is pending. Please make payment to access your results.`, { type: "fee_reminder", termName, amount });
};
exports.sendFeeReminder = sendFeeReminder;
/**
 * Send payment confirmation notification
 */
const sendPaymentConfirmation = async (studentId, amount, reference) => {
    const student = await student_model_1.Student.findById(studentId).select("userId");
    if (!student)
        return false;
    const formattedAmount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
    }).format(amount);
    return (0, exports.sendToUser)(student.userId, "Payment Confirmed", `Your payment of ${formattedAmount} has been confirmed. Reference: ${reference}`, { type: "payment_confirmation", amount, reference });
};
exports.sendPaymentConfirmation = sendPaymentConfirmation;
/**
 * Send score update notification
 */
const sendScoreUpdateNotification = async (studentId, subjectName) => {
    const student = await student_model_1.Student.findById(studentId).select("userId");
    if (!student)
        return false;
    return (0, exports.sendToUser)(student.userId, "Score Updated", `Your score for ${subjectName} has been updated.`, { type: "score_update", subjectName });
};
exports.sendScoreUpdateNotification = sendScoreUpdateNotification;
/**
 * Register push token for a user
 */
const registerPushToken = async (userId, token) => {
    if (!(0, expo_config_1.isValidExpoPushToken)(token)) {
        logger_util_1.logger.warn("Invalid Expo push token:", token);
        return false;
    }
    await user_model_1.User.findByIdAndUpdate(userId, { expoPushToken: token });
    logger_util_1.logger.info("Push token registered for user:", userId);
    return true;
};
exports.registerPushToken = registerPushToken;
/**
 * Remove push token for a user
 */
const removePushToken = async (userId) => {
    await user_model_1.User.findByIdAndUpdate(userId, { $unset: { expoPushToken: 1 } });
    logger_util_1.logger.info("Push token removed for user:", userId);
};
exports.removePushToken = removePushToken;
//# sourceMappingURL=notification.service.js.map
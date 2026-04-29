"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPushNotificationReceipts = exports.sendPushNotifications = exports.isValidExpoPushToken = exports.getExpoClient = exports.initializeExpo = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const logger_util_1 = require("../utils/logger.util");
let expoClient = null;
const initializeExpo = () => {
    if (expoClient) {
        return expoClient;
    }
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    expoClient = new expo_server_sdk_1.Expo({
        accessToken: accessToken || undefined,
    });
    logger_util_1.logger.info("Expo Server SDK initialized");
    return expoClient;
};
exports.initializeExpo = initializeExpo;
const getExpoClient = () => {
    if (!expoClient) {
        return (0, exports.initializeExpo)();
    }
    return expoClient;
};
exports.getExpoClient = getExpoClient;
const isValidExpoPushToken = (token) => {
    return expo_server_sdk_1.Expo.isExpoPushToken(token);
};
exports.isValidExpoPushToken = isValidExpoPushToken;
const sendPushNotifications = async (messages) => {
    const expo = (0, exports.getExpoClient)();
    const result = {
        successful: [],
        failed: [],
    };
    // Filter valid tokens
    const validMessages = messages.filter((message) => {
        if (typeof message.to === "string") {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(message.to)) {
                result.failed.push({
                    token: message.to,
                    error: "Invalid Expo push token",
                });
                return false;
            }
            return true;
        }
        return true;
    });
    if (validMessages.length === 0) {
        return result;
    }
    // Chunk messages for batch sending
    const chunks = expo.chunkPushNotifications(validMessages);
    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            result.successful.push(...ticketChunk);
        }
        catch (error) {
            logger_util_1.logger.error("Error sending push notification chunk:", error);
            chunk.forEach((msg) => {
                result.failed.push({
                    token: typeof msg.to === "string" ? msg.to : msg.to.join(", "),
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            });
        }
    }
    return result;
};
exports.sendPushNotifications = sendPushNotifications;
const getPushNotificationReceipts = async (ticketIds) => {
    const expo = (0, exports.getExpoClient)();
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const allReceipts = {};
    for (const chunk of receiptIdChunks) {
        try {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
            Object.assign(allReceipts, receipts);
        }
        catch (error) {
            logger_util_1.logger.error("Error getting push notification receipts:", error);
        }
    }
    return allReceipts;
};
exports.getPushNotificationReceipts = getPushNotificationReceipts;
//# sourceMappingURL=expo.config.js.map
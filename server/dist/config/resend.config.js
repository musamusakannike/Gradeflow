"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendConfig = exports.getResendClient = exports.initializeResend = void 0;
const resend_1 = require("resend");
const logger_util_1 = require("../utils/logger.util");
let resendClient = null;
const initializeResend = () => {
    if (resendClient) {
        return resendClient;
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        logger_util_1.logger.warn("Resend API key is not configured. Email sending will not work.");
        return null;
    }
    resendClient = new resend_1.Resend(apiKey);
    logger_util_1.logger.info("Resend client initialized");
    return resendClient;
};
exports.initializeResend = initializeResend;
const getResendClient = () => {
    if (!resendClient) {
        return (0, exports.initializeResend)();
    }
    return resendClient;
};
exports.getResendClient = getResendClient;
exports.resendConfig = {
    from: process.env.EMAIL_FROM || "noreply@gradeflow.com",
    appName: process.env.APP_NAME || "GradeFlow",
    appUrl: process.env.APP_URL || "http://localhost:3000",
};
//# sourceMappingURL=resend.config.js.map
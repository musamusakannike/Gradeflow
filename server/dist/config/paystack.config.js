"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackConfig = exports.getPaystackClient = exports.initializePaystack = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_util_1 = require("../utils/logger.util");
const PAYSTACK_BASE_URL = "https://api.paystack.co";
let paystackClient = null;
const initializePaystack = () => {
    if (paystackClient) {
        return paystackClient;
    }
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        logger_util_1.logger.warn("Paystack secret key is not configured. Payments will not work.");
    }
    paystackClient = axios_1.default.create({
        baseURL: PAYSTACK_BASE_URL,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
    });
    // Response interceptor for error handling
    paystackClient.interceptors.response.use((response) => response, (error) => {
        logger_util_1.logger.error("Paystack API Error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        return Promise.reject(error);
    });
    logger_util_1.logger.info("Paystack client initialized");
    return paystackClient;
};
exports.initializePaystack = initializePaystack;
const getPaystackClient = () => {
    if (!paystackClient) {
        return (0, exports.initializePaystack)();
    }
    return paystackClient;
};
exports.getPaystackClient = getPaystackClient;
exports.paystackConfig = {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",
    currency: "NGN",
    channels: ["card", "bank", "ussd", "bank_transfer"],
};
//# sourceMappingURL=paystack.config.js.map
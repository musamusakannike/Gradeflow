"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = exports.uploadLimiter = exports.paymentLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errors_util_1 = require("../utils/errors.util");
// Default rate limit values
const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 minutes
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);
/**
 * General API rate limiter
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: DEFAULT_WINDOW_MS,
    max: DEFAULT_MAX_REQUESTS,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new errors_util_1.TooManyRequestsError("Too many requests, please try again later."));
    },
});
/**
 * Strict rate limiter for authentication endpoints
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res, next) => {
        next(new errors_util_1.TooManyRequestsError("Too many authentication attempts, please try again later."));
    },
});
/**
 * Rate limiter for password reset
 */
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: "Too many password reset attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new errors_util_1.TooManyRequestsError("Too many password reset attempts, please try again later."));
    },
});
/**
 * Rate limiter for payment endpoints
 */
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 payment initiations per hour
    message: "Too many payment attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new errors_util_1.TooManyRequestsError("Too many payment attempts, please try again later."));
    },
});
/**
 * Rate limiter for file uploads
 */
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: "Too many upload attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new errors_util_1.TooManyRequestsError("Too many upload attempts, please try again later."));
    },
});
/**
 * Custom rate limiter factory
 */
const createRateLimiter = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: message || "Too many requests, please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            next(new errors_util_1.TooManyRequestsError(message || "Too many requests, please try again later."));
        },
    });
};
exports.createRateLimiter = createRateLimiter;
//# sourceMappingURL=rate-limit.middleware.js.map
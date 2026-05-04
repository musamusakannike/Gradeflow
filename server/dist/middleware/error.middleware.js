"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.notFoundHandler = void 0;
const errors_util_1 = require("../utils/errors.util");
const response_util_1 = require("../utils/response.util");
const logger_util_1 = require("../utils/logger.util");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
    (0, response_util_1.sendError)(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND");
};
exports.notFoundHandler = notFoundHandler;
/**
 * Global error handler
 */
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    // Log error
    logger_util_1.logger.error("Error:", {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        user: req.user?._id,
    });
    // Handle known operational errors
    if (err instanceof errors_util_1.AppError) {
        if (err instanceof errors_util_1.ValidationError) {
            (0, response_util_1.sendError)(res, err.message, err.statusCode, err.code, err.errors);
            return;
        }
        (0, response_util_1.sendError)(res, err.message, err.statusCode, err.code);
        return;
    }
    // Handle Mongoose validation errors
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        const errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = [err.errors[key].message];
        });
        (0, response_util_1.sendError)(res, "Validation failed", 422, "VALIDATION_ERROR", errors);
        return;
    }
    // Handle Mongoose CastError (invalid ObjectId)
    if (err instanceof mongoose_1.default.Error.CastError) {
        (0, response_util_1.sendError)(res, `Invalid ${err.path}: ${err.value}`, 400, "INVALID_ID");
        return;
    }
    // Handle MongoDB duplicate key error
    const mongoErr = err;
    if (mongoErr.code === 11000) {
        const field = mongoErr.keyPattern
            ? Object.keys(mongoErr.keyPattern)[0]
            : "field";
        const value = mongoErr.keyValue
            ? Object.values(mongoErr.keyValue)[0]
            : "value";
        (0, response_util_1.sendError)(res, `Duplicate value for ${field}: ${value}`, 409, "DUPLICATE_KEY");
        return;
    }
    // Handle JWT errors (if not caught by middleware)
    if (err.name === "JsonWebTokenError") {
        (0, response_util_1.sendError)(res, "Invalid token", 401, "INVALID_TOKEN");
        return;
    }
    if (err.name === "TokenExpiredError") {
        (0, response_util_1.sendError)(res, "Token expired", 401, "TOKEN_EXPIRED");
        return;
    }
    // Handle syntax errors in JSON
    if (err instanceof SyntaxError && "body" in err) {
        (0, response_util_1.sendError)(res, "Invalid JSON", 400, "INVALID_JSON");
        return;
    }
    // Default to 500 Internal Server Error
    const statusCode = 500;
    const message = process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message;
    (0, response_util_1.sendError)(res, message, statusCode, "INTERNAL_ERROR");
};
exports.errorHandler = errorHandler;
/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map
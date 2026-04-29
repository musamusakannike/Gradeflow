import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors.util";
import { sendError } from "../utils/response.util";
import { logger } from "../utils/logger.util";
import mongoose from "mongoose";

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

/**
 * Handle 404 errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    "ROUTE_NOT_FOUND",
  );
};

/**
 * Global error handler
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  // Log error
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: (req as unknown as { user?: { _id: string } }).user?._id,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      sendError(res, err.message, err.statusCode, err.code, err.errors);
      return;
    }
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = [err.errors[key].message];
    });
    sendError(res, "Validation failed", 422, "VALIDATION_ERROR", errors);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    sendError(res, `Invalid ${err.path}: ${err.value}`, 400, "INVALID_ID");
    return;
  }

  // Handle MongoDB duplicate key error
  const mongoErr = err as MongoError;
  if (mongoErr.code === 11000) {
    const field = mongoErr.keyPattern
      ? Object.keys(mongoErr.keyPattern)[0]
      : "field";
    const value = mongoErr.keyValue
      ? Object.values(mongoErr.keyValue)[0]
      : "value";
    sendError(
      res,
      `Duplicate value for ${field}: ${value}`,
      409,
      "DUPLICATE_KEY",
    );
    return;
  }

  // Handle JWT errors (if not caught by middleware)
  if (err.name === "JsonWebTokenError") {
    sendError(res, "Invalid token", 401, "INVALID_TOKEN");
    return;
  }

  if (err.name === "TokenExpiredError") {
    sendError(res, "Token expired", 401, "TOKEN_EXPIRED");
    return;
  }

  // Handle syntax errors in JSON
  if (err instanceof SyntaxError && "body" in err) {
    sendError(res, "Invalid JSON", 400, "INVALID_JSON");
    return;
  }

  // Default to 500 Internal Server Error
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message;

  sendError(res, message, statusCode, "INTERNAL_ERROR");
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

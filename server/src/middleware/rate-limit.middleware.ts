import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../utils/errors.util";

// Default rate limit values
const DEFAULT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000",
  10,
); // 15 minutes
const DEFAULT_MAX_REQUESTS = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "100",
  10,
);

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: DEFAULT_WINDOW_MS,
  max: DEFAULT_MAX_REQUESTS,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new TooManyRequestsError("Too many requests, please try again later."),
    );
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res, next) => {
    next(
      new TooManyRequestsError(
        "Too many authentication attempts, please try again later.",
      ),
    );
  },
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: "Too many password reset attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new TooManyRequestsError(
        "Too many password reset attempts, please try again later.",
      ),
    );
  },
});

/**
 * Rate limiter for payment endpoints
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 payment initiations per hour
  message: "Too many payment attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new TooManyRequestsError(
        "Too many payment attempts, please try again later.",
      ),
    );
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: "Too many upload attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new TooManyRequestsError(
        "Too many upload attempts, please try again later.",
      ),
    );
  },
});

/**
 * Custom rate limiter factory
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message?: string,
) => {
  return rateLimit({
    windowMs,
    max,
    message: message || "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new TooManyRequestsError(
          message || "Too many requests, please try again later.",
        ),
      );
    },
  });
};

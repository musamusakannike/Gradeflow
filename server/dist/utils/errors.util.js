"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.InternalServerError = exports.TooManyRequestsError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request', code) {
        super(message, 400, code);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code) {
        super(message, 401, code);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code) {
        super(message, 403, code);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code) {
        super(message, 404, code);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflict', code) {
        super(message, 409, code);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = {}) {
        super(message, 422, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests', code) {
        super(message, 429, code);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error', code) {
        super(message, 500, code);
    }
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable', code) {
        super(message, 503, code);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=errors.util.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta) => {
    const response = {
        success: true,
        message,
        data,
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, code, errors) => {
    const response = {
        success: false,
        message,
    };
    if (code) {
        response.code = code;
    }
    if (errors) {
        response.errors = errors;
    }
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
    return (0, exports.sendSuccess)(res, data, message, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.util.js.map
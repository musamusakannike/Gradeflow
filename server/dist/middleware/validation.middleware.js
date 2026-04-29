"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimStrings = exports.sanitizeBody = exports.validate = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const zod_1 = require("zod");
const errors_util_1 = require("../utils/errors.util");
/**
 * Validate request using Zod
 */
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = {};
                error.issues.forEach((issue) => {
                    const path = issue.path.join(".");
                    if (!formattedErrors[path]) {
                        formattedErrors[path] = [];
                    }
                    formattedErrors[path].push(issue.message);
                });
                next(new errors_util_1.ValidationError("Validation failed", formattedErrors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Validate request using express-validator
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            next();
            return;
        }
        // Format errors
        const formattedErrors = {};
        errors.array().forEach((error) => {
            if (error.type === "field") {
                const field = error.path;
                if (!formattedErrors[field]) {
                    formattedErrors[field] = [];
                }
                formattedErrors[field].push(error.msg);
            }
        });
        next(new errors_util_1.ValidationError("Validation failed", formattedErrors));
    };
};
exports.validate = validate;
/**
 * Sanitize request body - remove undefined values
 */
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        Object.keys(req.body).forEach((key) => {
            if (req.body[key] === undefined || req.body[key] === "") {
                delete req.body[key];
            }
        });
    }
    next();
};
exports.sanitizeBody = sanitizeBody;
/**
 * Trim string fields in request body
 */
const trimStrings = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        Object.keys(req.body).forEach((key) => {
            if (typeof req.body[key] === "string") {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};
exports.trimStrings = trimStrings;
//# sourceMappingURL=validation.middleware.js.map
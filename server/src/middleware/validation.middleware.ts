import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ValidationError } from "../utils/errors.util";

/**
 * Validate request using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    // Format errors
    const formattedErrors: Record<string, string[]> = {};

    errors.array().forEach((error) => {
      if (error.type === "field") {
        const field = error.path;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(error.msg);
      }
    });

    next(new ValidationError("Validation failed", formattedErrors));
  };
};

/**
 * Sanitize request body - remove undefined values
 */
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === undefined || req.body[key] === "") {
        delete req.body[key];
      }
    });
  }
  next();
};

/**
 * Trim string fields in request body
 */
export const trimStrings = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

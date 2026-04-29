import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: SuccessResponse<T>['meta']
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  errors?: Record<string, string[]>
): Response => {
  const response: ErrorResponse = {
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

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success'
): Response => {
  return sendSuccess(res, data, message, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

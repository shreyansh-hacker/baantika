import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { env } from '../config/env';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
  } else {
    logger.error({ err }, 'Unexpected error');
  }

  // Handle known AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: getErrorCode(err.statusCode),
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    };
    res.status(400).json(response);
    return;
  }

  // Handle Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaResponse = handlePrismaError(err);
    res.status(prismaResponse.statusCode).json({
      success: false,
      error: {
        code: prismaResponse.code,
        message: prismaResponse.message,
      },
    });
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      ...(env.NODE_ENV !== 'production' && { details: err.stack }),
    },
  };
  res.status(500).json(response);
};

function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTHENTICATION_ERROR';
    case 403:
      return 'AUTHORIZATION_ERROR';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    default:
      return 'INTERNAL_ERROR';
  }
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  code: string;
  message: string;
} {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: `A record with this ${target} already exists`,
      };
    }
    case 'P2025':
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Record not found',
      };
    case 'P2003':
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Related record not found',
      };
    default:
      return {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Database error',
      };
  }
}

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorDetails: string | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorDetails = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.message.includes('JWT')) {
    statusCode = 401;
    message = 'Authentication failed';
  } else {
    // Log unexpected errors
    console.error('Unexpected error:', error);
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment && statusCode === 500) {
    message = 'Something went wrong';
    errorDetails = undefined;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: isDevelopment ? errorDetails || error.message : undefined
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
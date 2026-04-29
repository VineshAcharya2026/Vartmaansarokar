export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let errorDetails;
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errorDetails = error.message;
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
    }
    else if (error.message.includes('JWT')) {
        statusCode = 401;
        message = 'Authentication failed';
    }
    else {
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
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

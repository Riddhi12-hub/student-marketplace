/**
 * Error Handling Middleware
 * Centralized error management
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper - eliminates try/catch boilerplate
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Mongoose validation error handler
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join('. '), 400);
};

// Mongoose duplicate key error
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`, 409);
};

// Mongoose cast error (invalid ObjectId)
const handleCastError = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

// Global error middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Handle specific Mongoose errors
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'CastError') error = handleCastError(err);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

module.exports = { AppError, asyncHandler, errorHandler };

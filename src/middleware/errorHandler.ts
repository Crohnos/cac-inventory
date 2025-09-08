import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`${req.method} ${req.path} - Error:`, error.message);
  console.error('Stack:', error.stack);

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    statusCode = 400;
    message = 'Invalid reference - related resource not found';
  } else if (error.message.includes('NOT NULL constraint failed')) {
    statusCode = 400;
    message = 'Missing required fields';
  }

  res.status(statusCode).json({
    error: {
      message,
      code: error.code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Central error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error Handler Middleware caught an error:');
  console.error(`Error type: ${err.name}`);
  console.error(`Error message: ${err.message}`);
  console.error(`Request URL: ${req.originalUrl}`);
  console.error(`Request method: ${req.method}`);
  
  if (err.stack) {
    console.error('Stack trace:', err.stack);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    console.log('Validation error details:', JSON.stringify(err.errors));
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  // Handle specific known errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: err.message || 'Resource not found'
    });
  }

  // Add detailed logging for specific error types
  if (err.name === 'SyntaxError') {
    console.error('Syntax error in request:', err);
  } else if (err.name === 'TypeError') {
    console.error('Type error (may indicate null/undefined access):', err);
  } else if (err.name === 'SQLiteError') {
    console.error('Database error:', err);
  }

  // Default error response
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  console.log(`Responding with status code ${statusCode}`);
  
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
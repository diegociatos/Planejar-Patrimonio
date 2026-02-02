// ===========================================
// Planejar Patrimônio - Error Handler Middleware
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { env } from '../config/env.js';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error in development
  if (env.isDevelopment) {
    console.error('Error:', err);
  }

  // Handle operational errors (AppError)
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.message,
    };

    // Include validation errors if present
    if (err instanceof ValidationError && err.errors.length > 0) {
      response.validationErrors = err.errors;
    }

    // Include stack trace in development
    if (env.isDevelopment) {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expirado',
    });
    return;
  }

  // Handle MySQL errors
  if ((err as any).code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      error: 'Registro duplicado',
    });
    return;
  }

  if ((err as any).code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({
      success: false,
      error: 'Referência inválida',
    });
    return;
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = env.isProduction 
    ? 'Erro interno do servidor' 
    : err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: ${req.method} ${req.path}`,
  });
}

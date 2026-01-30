// ===========================================
// Planejar Patrimônio - Authentication Middleware
// ===========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JwtPayload, UserRole } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autenticação não fornecido');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedError('Token inválido ou expirado');
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user has required roles
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuário não autenticado');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Você não tem permissão para acessar este recurso');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user is admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  authorize(UserRole.ADMINISTRATOR)(req, res, next);
}

/**
 * Middleware to check if user is consultant or admin
 */
export function isConsultantOrAdmin(req: Request, res: Response, next: NextFunction): void {
  authorize(UserRole.ADMINISTRATOR, UserRole.CONSULTANT)(req, res, next);
}

/**
 * Middleware to check if user is staff (consultant, auxiliary, or admin)
 */
export function isStaff(req: Request, res: Response, next: NextFunction): void {
  authorize(UserRole.ADMINISTRATOR, UserRole.CONSULTANT, UserRole.AUXILIARY)(req, res, next);
}

/**
 * Generate JWT token for a user
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Decode JWT token without verification (useful for getting payload from expired tokens)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

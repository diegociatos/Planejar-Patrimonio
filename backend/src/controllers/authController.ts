// ===========================================
// Planejar Patrimônio - Auth Controller
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { generateToken } from '../middlewares/auth.js';
import { omit } from '../utils/helpers.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await userService.verifyCredentials(email, password);

      // Check if password change is required
      if (user.requiresPasswordChange) {
        res.status(200).json({
          success: true,
          data: {
            requiresPasswordChange: true,
            userId: user.id,
            message: 'Alteração de senha obrigatória',
          },
        });
        return;
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        success: true,
        data: {
          user: omit(user, ['password']),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Change user password (for first login or password change)
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      if (!userId || !newPassword) {
        throw new BadRequestError('userId e newPassword são obrigatórios');
      }

      const user = await userService.findById(userId);
      if (!user) {
        throw new UnauthorizedError('Usuário não encontrado');
      }

      // If current password is provided, verify it
      if (currentPassword) {
        await userService.verifyCredentials(user.email, currentPassword);
      }

      // Update password
      await userService.updatePassword(userId, newPassword);

      // Generate token for automatic login
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const updatedUser = await userService.findById(userId);

      res.status(200).json({
        success: true,
        data: {
          user: omit(updatedUser!, ['password']),
          token,
          message: 'Senha alterada com sucesso',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset (mock - in production would send email)
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Check if user exists (don't reveal if email exists for security)
      const user = await userService.findByEmail(email);

      // In production, send email with reset link
      // For now, just log and return success
      if (user) {
        console.log(`Password reset requested for: ${email}`);
      }

      res.status(200).json({
        success: true,
        message: 'Se o e-mail existir, você receberá instruções para redefinir sua senha.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError('Usuário não autenticado');
      }

      const user = await userService.findById(userId);

      if (!user) {
        throw new UnauthorizedError('Usuário não encontrado');
      }

      // Get qualification data if user is a partner
      let qualificationData = null;
      let documents: any[] = [];

      if (user.clientType === 'partner') {
        qualificationData = await userService.getQualificationData(userId);
        documents = await userService.getUserDocuments(userId);
      }

      res.status(200).json({
        success: true,
        data: {
          ...omit(user, ['password']),
          qualificationData,
          documents,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (client-side should clear token)
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a more complex setup, we could invalidate the token here
      // For JWT, the client just needs to delete the token

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

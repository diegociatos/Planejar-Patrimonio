// ===========================================
// Planejar Patrimônio - User Controller
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { omit, generateRandomPassword } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '../types/index.js';

export class UserController {
  /**
   * GET /api/users
   * Get all users (optionally filtered by role)
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as UserRole | undefined;

      const users = await userService.findAll(role);

      res.status(200).json({
        success: true,
        data: users.map(u => omit(u, ['password'])),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.findById(id);

      if (!user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      // Get additional data for clients
      let qualificationData = null;
      let documents: any[] = [];

      if (user.clientType === 'partner') {
        qualificationData = await userService.getQualificationData(id);
        documents = await userService.getUserDocuments(id);
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
   * POST /api/users
   * Create a new user
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role, clientType } = req.body;

      // Generate random password if not provided
      const userPassword = password || generateRandomPassword();

      const user = await userService.create({
        name,
        email,
        password: userPassword,
        role: role || UserRole.CLIENT,
        clientType,
        requiresPasswordChange: true,
      });

      // Send welcome email with credentials
      try {
        await sendWelcomeEmail(email, name, userPassword);
        console.log(`Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        success: true,
        data: {
          ...omit(user, ['password']),
          temporaryPassword: password ? undefined : userPassword, // Only return if generated
        },
        message: 'Usuário criado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Update user
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, role, clientType, avatarUrl } = req.body;

      // Only admins can change roles
      if (role && req.user?.role !== UserRole.ADMINISTRATOR) {
        throw new ForbiddenError('Apenas administradores podem alterar funções');
      }

      const user = await userService.update(id, {
        name,
        email,
        role,
        clientType,
        avatarUrl,
      });

      res.status(200).json({
        success: true,
        data: omit(user, ['password']),
        message: 'Usuário atualizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete user
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user?.userId) {
        throw new ForbiddenError('Você não pode deletar sua própria conta');
      }

      await userService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Usuário deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/reset-password
   * Reset user password (admin function)
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const temporaryPassword = generateRandomPassword();
      await userService.resetPassword(id, temporaryPassword);

      res.status(200).json({
        success: true,
        data: {
          temporaryPassword,
        },
        message: 'Senha resetada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id/qualification
   * Update partner qualification data
   */
  async updateQualification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Users can only update their own qualification (except admins/consultants)
      if (
        req.user?.userId !== id &&
        req.user?.role !== UserRole.ADMINISTRATOR &&
        req.user?.role !== UserRole.CONSULTANT
      ) {
        throw new ForbiddenError('Você não tem permissão para atualizar estes dados');
      }

      const qualificationData = await userService.updateQualificationData(id, req.body);

      res.status(200).json({
        success: true,
        data: qualificationData,
        message: 'Dados de qualificação atualizados com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/documents
   * Add user document
   */
  async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, category, url } = req.body;

      const document = await userService.addUserDocument({
        userId: id,
        name,
        category,
        url,
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Documento adicionado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id/documents/:documentId
   * Delete user document
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentId } = req.params;

      await userService.deleteUserDocument(documentId);

      res.status(200).json({
        success: true,
        message: 'Documento removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

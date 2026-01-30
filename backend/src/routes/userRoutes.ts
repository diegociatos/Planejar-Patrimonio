// ===========================================
// Planejar Patrimônio - User Routes
// ===========================================

import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/userController.js';
import { authenticate, authorize, isConsultantOrAdmin, isAdmin } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (consultants and admins)
router.get(
  '/',
  isConsultantOrAdmin,
  userController.getAll.bind(userController)
);

// Get user by ID
router.get(
  '/:id',
  userController.getById.bind(userController)
);

// Create user (consultants and admins)
router.post(
  '/',
  isConsultantOrAdmin,
  validate([
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido'),
    body('role').optional().isIn(Object.values(UserRole)).withMessage('Função inválida'),
  ]),
  userController.create.bind(userController)
);

// Update user
router.put(
  '/:id',
  validate([
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('E-mail inválido'),
  ]),
  userController.update.bind(userController)
);

// Delete user (admin only)
router.delete(
  '/:id',
  isAdmin,
  userController.delete.bind(userController)
);

// Reset password (admin only)
router.post(
  '/:id/reset-password',
  isAdmin,
  userController.resetPassword.bind(userController)
);

// Update qualification data
router.put(
  '/:id/qualification',
  userController.updateQualification.bind(userController)
);

// User documents
router.post(
  '/:id/documents',
  validate([
    body('name').notEmpty().withMessage('Nome do documento é obrigatório'),
    body('category').notEmpty().withMessage('Categoria é obrigatória'),
    body('url').notEmpty().withMessage('URL é obrigatória'),
  ]),
  userController.addDocument.bind(userController)
);

router.delete(
  '/:id/documents/:documentId',
  userController.deleteDocument.bind(userController)
);

export default router;

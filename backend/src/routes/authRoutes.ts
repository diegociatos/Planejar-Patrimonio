// ===========================================
// Planejar Patrimônio - Auth Routes
// ===========================================

import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('E-mail inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ]),
  authController.login.bind(authController)
);

// Change password
router.post(
  '/change-password',
  validate([
    body('userId').notEmpty().withMessage('userId é obrigatório'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter no mínimo 6 caracteres'),
  ]),
  authController.changePassword.bind(authController)
);

// Forgot password
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('E-mail inválido'),
  ]),
  authController.forgotPassword.bind(authController)
);

// Get current user (protected)
router.get('/me', authenticate, authController.me.bind(authController));

// Logout
router.post('/logout', authenticate, authController.logout.bind(authController));

export default router;

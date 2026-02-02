// ===========================================
// Planejar Patrimônio - Routes Index
// ===========================================

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import documentRoutes from './documentRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Planejar Patrimônio está funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);

export default router;

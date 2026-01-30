// ===========================================
// Planejar Patrimônio - Notification Routes
// ===========================================

import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications
router.get('/', notificationController.getAll.bind(notificationController));

// Mark as read
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

// Delete notification
router.delete('/:id', notificationController.delete.bind(notificationController));

// Delete all notifications
router.delete('/', notificationController.deleteAll.bind(notificationController));

export default router;

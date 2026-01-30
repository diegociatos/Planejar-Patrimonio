// ===========================================
// Planejar Patrimônio - Notification Controller
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get notifications for current user
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { unreadOnly } = req.query;

      const notifications = await notificationService.findByUser(
        userId,
        unreadOnly === 'true'
      );

      const unreadCount = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await notificationService.markAsRead(id);

      res.status(200).json({
        success: true,
        message: 'Notificação marcada como lida',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await notificationService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Notificação removida',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications
   * Delete all notifications for current user
   */
  async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      await notificationService.deleteAllForUser(userId);

      res.status(200).json({
        success: true,
        message: 'Todas as notificações foram removidas',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();

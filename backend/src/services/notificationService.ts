// ===========================================
// Planejar Patrimônio - Notification Service
// ===========================================

import { query, queryOne } from '../config/database.js';
import { Notification, NotificationType } from '../types/index.js';
import { generateId, transformRow, transformRows } from '../utils/helpers.js';

export class NotificationService {
  /**
   * Get notifications for user
   */
  async findByUser(userId: string, onlyUnread: boolean = false): Promise<Notification[]> {
    let sql = `SELECT * FROM notifications WHERE recipient_id = ?`;
    const params: any[] = [userId];

    if (onlyUnread) {
      sql += ' AND is_read = FALSE';
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const rows = await query(sql, params);
    return transformRows<Notification>(rows);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const row = await queryOne<any>(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = FALSE',
      [userId]
    );
    return row?.count || 0;
  }

  /**
   * Create notification
   */
  async create(data: {
    recipientId: string;
    title: string;
    message: string;
    link?: string;
    type?: NotificationType;
  }): Promise<Notification> {
    const id = generateId();

    await query(
      `INSERT INTO notifications (id, recipient_id, title, message, link, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.recipientId,
        data.title,
        data.message,
        data.link || '',
        data.type || 'alert',
      ]
    );

    return (await queryOne('SELECT * FROM notifications WHERE id = ?', [id])) as Notification;
  }

  /**
   * Mark as read
   */
  async markAsRead(id: string): Promise<void> {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
  }

  /**
   * Mark all as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE recipient_id = ? AND is_read = FALSE',
      [userId]
    );
  }

  /**
   * Delete notification
   */
  async delete(id: string): Promise<void> {
    await query('DELETE FROM notifications WHERE id = ?', [id]);
  }

  /**
   * Delete all for user
   */
  async deleteAllForUser(userId: string): Promise<void> {
    await query('DELETE FROM notifications WHERE recipient_id = ?', [userId]);
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultiple(
    recipientIds: string[],
    data: { title: string; message: string; link?: string; type?: NotificationType }
  ): Promise<void> {
    for (const recipientId of recipientIds) {
      await this.create({
        recipientId,
        ...data,
      });
    }
  }

  /**
   * Send notification to project members
   */
  async sendToProjectMembers(
    projectId: string,
    excludeUserId: string,
    data: { title: string; message: string; link?: string; type?: NotificationType }
  ): Promise<void> {
    // Get all project members
    const rows = await query(
      `SELECT DISTINCT user_id FROM (
         SELECT consultant_id as user_id FROM projects WHERE id = ?
         UNION
         SELECT auxiliary_id as user_id FROM projects WHERE id = ? AND auxiliary_id IS NOT NULL
         UNION
         SELECT user_id FROM project_clients WHERE project_id = ?
       ) as members WHERE user_id != ?`,
      [projectId, projectId, projectId, excludeUserId]
    );

    const recipientIds = rows.map((r: any) => r.user_id);
    await this.sendToMultiple(recipientIds, data);
  }
}

export const notificationService = new NotificationService();

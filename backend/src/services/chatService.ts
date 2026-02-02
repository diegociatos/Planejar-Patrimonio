// ===========================================
// Planejar Patrimônio - Chat Service
// ===========================================

import { query, queryOne } from '../config/database.js';
import { ChatMessage } from '../types/index.js';
import { generateId, transformRow, transformRows } from '../utils/helpers.js';

export type ChatType = 'client' | 'internal' | 'phase';

export class ChatService {
  /**
   * Get messages for a project chat
   */
  async getProjectMessages(projectId: string, chatType: ChatType): Promise<any[]> {
    const rows = await query(
      `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar_url, u.role as author_role
       FROM chat_messages cm
       LEFT JOIN users u ON cm.author_id = u.id
       WHERE cm.project_id = ? AND cm.chat_type = ? AND cm.phase_id IS NULL
       ORDER BY cm.created_at ASC`,
      [projectId, chatType]
    );
    return transformRows(rows);
  }

  /**
   * Get messages for a phase discussion
   */
  async getPhaseMessages(projectId: string, phaseId: string): Promise<any[]> {
    const rows = await query(
      `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar_url, u.role as author_role
       FROM chat_messages cm
       LEFT JOIN users u ON cm.author_id = u.id
       WHERE cm.project_id = ? AND cm.phase_id = ? AND cm.chat_type = 'phase'
       ORDER BY cm.created_at ASC`,
      [projectId, phaseId]
    );
    return transformRows(rows);
  }

  /**
   * Send message to project chat
   */
  async sendMessage(data: {
    projectId: string;
    chatType: ChatType;
    phaseId?: string;
    authorId: string;
    content: string;
  }): Promise<any> {
    const id = generateId();

    await query(
      `INSERT INTO chat_messages (id, project_id, chat_type, phase_id, author_id, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.projectId, data.chatType, data.phaseId || null, data.authorId, data.content]
    );

    // Return message with author info
    const row = await queryOne(
      `SELECT cm.*, u.name as author_name, u.avatar_url as author_avatar_url, u.role as author_role
       FROM chat_messages cm
       LEFT JOIN users u ON cm.author_id = u.id
       WHERE cm.id = ?`,
      [id]
    );

    return transformRow(row);
  }

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<void> {
    await query('DELETE FROM chat_messages WHERE id = ?', [id]);
  }

  /**
   * Get recent messages across all user's projects
   */
  async getRecentMessagesForUser(userId: string, limit: number = 20): Promise<any[]> {
    const rows = await query(
      `SELECT cm.*, u.name as author_name, p.name as project_name
       FROM chat_messages cm
       LEFT JOIN users u ON cm.author_id = u.id
       LEFT JOIN projects p ON cm.project_id = p.id
       LEFT JOIN project_clients pc ON p.id = pc.project_id
       WHERE (pc.user_id = ? OR p.consultant_id = ? OR p.auxiliary_id = ?)
       ORDER BY cm.created_at DESC
       LIMIT ?`,
      [userId, userId, userId, limit]
    );
    return transformRows(rows);
  }
}

export const chatService = new ChatService();

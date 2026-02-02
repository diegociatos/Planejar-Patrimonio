// ===========================================
// Planejar Patrimônio - Task Service
// ===========================================

import { query, queryOne } from '../config/database.js';
import { Task, TaskStatus, UserRole } from '../types/index.js';
import { generateId, transformRow, transformRows } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export class TaskService {
  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const row = await queryOne(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    return row ? transformRow<Task>(row) : null;
  }

  /**
   * Get tasks by project
   */
  async findByProject(projectId: string): Promise<Task[]> {
    const rows = await query(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    return transformRows<Task>(rows);
  }

  /**
   * Get tasks by phase
   */
  async findByPhase(phaseId: string): Promise<Task[]> {
    const rows = await query(
      'SELECT * FROM tasks WHERE phase_id = ? ORDER BY created_at DESC',
      [phaseId]
    );
    return transformRows<Task>(rows);
  }

  /**
   * Get tasks assigned to user
   */
  async findByAssignee(userId: string): Promise<Task[]> {
    const rows = await query(
      `SELECT t.*, p.name as project_name, ph.title as phase_title, ph.phase_number
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN phases ph ON t.phase_id = ph.id
       WHERE t.assignee_id = ? AND t.status = 'pending'
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return transformRows(rows);
  }

  /**
   * Get tasks by role
   */
  async findByRole(role: UserRole): Promise<Task[]> {
    const rows = await query(
      `SELECT t.*, p.name as project_name, ph.title as phase_title, ph.phase_number
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN phases ph ON t.phase_id = ph.id
       WHERE t.assignee_role = ? AND t.status = 'pending'
       ORDER BY t.created_at DESC`,
      [role]
    );
    return transformRows(rows);
  }

  /**
   * Create task
   */
  async create(data: {
    phaseId: string;
    projectId: string;
    description: string;
    assigneeId?: string;
    assigneeRole?: UserRole;
    createdBy: string;
    relatedDocumentId?: string;
    createdByAI?: boolean;
  }): Promise<Task> {
    const id = generateId();

    await query(
      `INSERT INTO tasks 
       (id, phase_id, project_id, description, status, assignee_id, assignee_role, created_by, related_document_id, created_by_ai)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        id,
        data.phaseId,
        data.projectId,
        data.description,
        data.assigneeId || null,
        data.assigneeRole || null,
        data.createdBy,
        data.relatedDocumentId || null,
        data.createdByAI ?? false,
      ]
    );

    return (await this.findById(id))!;
  }

  /**
   * Complete task
   */
  async complete(id: string, completedBy: string): Promise<Task> {
    const task = await this.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    if (task.status !== 'pending') {
      throw new ForbiddenError('Tarefa já foi completada ou aprovada');
    }

    await query(
      `UPDATE tasks SET status = 'completed', completed_by = ?, completed_at = NOW() WHERE id = ?`,
      [completedBy, id]
    );

    return (await this.findById(id))!;
  }

  /**
   * Approve task
   */
  async approve(id: string, approvedBy: string): Promise<Task> {
    const task = await this.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    if (task.status !== 'completed') {
      throw new ForbiddenError('Tarefa precisa ser completada antes de ser aprovada');
    }

    await query(
      `UPDATE tasks SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [approvedBy, id]
    );

    return (await this.findById(id))!;
  }

  /**
   * Update task
   */
  async update(id: string, data: Partial<Task>): Promise<Task> {
    const task = await this.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.assigneeId !== undefined) {
      updates.push('assignee_id = ?');
      params.push(data.assigneeId);
    }

    if (data.assigneeRole !== undefined) {
      updates.push('assignee_role = ?');
      params.push(data.assigneeRole);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return (await this.findById(id))!;
  }

  /**
   * Delete task
   */
  async delete(id: string): Promise<void> {
    const task = await this.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    await query('DELETE FROM tasks WHERE id = ?', [id]);
  }

  /**
   * Get tasks with details
   */
  async findByPhaseWithDetails(phaseId: string): Promise<any[]> {
    const rows = await query(
      `SELECT t.*, 
              u1.name as assignee_name,
              u2.name as created_by_name,
              u3.name as completed_by_name,
              u4.name as approved_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assignee_id = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       LEFT JOIN users u3 ON t.completed_by = u3.id
       LEFT JOIN users u4 ON t.approved_by = u4.id
       WHERE t.phase_id = ?
       ORDER BY t.created_at DESC`,
      [phaseId]
    );
    return transformRows(rows);
  }
}

export const taskService = new TaskService();

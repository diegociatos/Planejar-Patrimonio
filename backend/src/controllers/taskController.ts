// ===========================================
// Planejar Patrimônio - Task Controller
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { projectService } from '../services/projectService.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '../types/index.js';

export class TaskController {
  /**
   * GET /api/tasks
   * Get tasks for current user
   */
  async getMyTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Get tasks assigned to user
      const userTasks = await taskService.findByAssignee(userId);

      // Also get tasks by role
      const roleTasks = await taskService.findByRole(userRole);

      // Merge and deduplicate
      const allTaskIds = new Set<string>();
      const allTasks: any[] = [];

      for (const task of [...userTasks, ...roleTasks]) {
        if (!allTaskIds.has(task.id)) {
          allTaskIds.add(task.id);
          allTasks.push(task);
        }
      }

      res.status(200).json({
        success: true,
        data: allTasks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/tasks
   * Get tasks for a project
   */
  async getByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;

      const tasks = await taskService.findByProject(projectId);

      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/phases/:phaseNumber/tasks
   * Get tasks for a phase
   */
  async getByPhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, phaseNumber } = req.params;

      // Get phase ID from project and phase number
      const phase = await projectService.getPhase(projectId, parseInt(phaseNumber));
      if (!phase || !phase.id) {
        throw new NotFoundError('Fase não encontrada');
      }

      const tasks = await taskService.findByPhaseWithDetails(phase.id);

      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/phases/:phaseNumber/tasks
   * Create task in a phase
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, phaseNumber } = req.params;
      const { description, assigneeId, assigneeRole, relatedDocumentId } = req.body;
      const createdBy = req.user!.userId;

      // Get phase ID from project and phase number
      const phase = await projectService.getPhase(projectId, parseInt(phaseNumber));
      if (!phase) {
        throw new NotFoundError('Fase não encontrada');
      }

      const task = await taskService.create({
        phaseId: phase.id,
        projectId,
        description,
        assigneeId,
        assigneeRole,
        createdBy,
        relatedDocumentId,
      });

      // Add activity log
      await projectService.addLogEntry(projectId, createdBy, `criou uma nova tarefa na Fase ${phaseNumber}.`);

      res.status(201).json({
        success: true,
        data: task,
        message: 'Tarefa criada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tasks/:id
   * Update task
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { description, assigneeId, assigneeRole } = req.body;

      const task = await taskService.update(id, {
        description,
        assigneeId,
        assigneeRole,
      });

      res.status(200).json({
        success: true,
        data: task,
        message: 'Tarefa atualizada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tasks/:id/complete
   * Mark task as completed
   */
  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const task = await taskService.complete(id, userId);

      res.status(200).json({
        success: true,
        data: task,
        message: 'Tarefa completada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tasks/:id/approve
   * Approve completed task
   */
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Only consultants and admins can approve
      if (userRole !== UserRole.CONSULTANT && userRole !== UserRole.ADMINISTRATOR) {
        throw new ForbiddenError('Apenas consultores e administradores podem aprovar tarefas');
      }

      const task = await taskService.approve(id, userId);

      res.status(200).json({
        success: true,
        data: task,
        message: 'Tarefa aprovada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tasks/:id
   * Delete task
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await taskService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Tarefa deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();

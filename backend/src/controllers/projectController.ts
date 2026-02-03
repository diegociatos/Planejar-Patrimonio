// ===========================================
// Planejar Patrimônio - Project Controller
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService.js';
import { userService } from '../services/userService.js';
import { taskService } from '../services/taskService.js';
import { documentService } from '../services/documentService.js';
import { chatService } from '../services/chatService.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '../types/index.js';
import { omit, generateRandomPassword } from '../utils/helpers.js';

export class ProjectController {
  /**
   * GET /api/projects
   * Get all projects (filtered by user role)
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      let projects;

      if (userRole === UserRole.ADMINISTRATOR) {
        // Admins see all projects
        projects = await projectService.findAll();
      } else if (userRole === UserRole.CONSULTANT) {
        // Consultants see their projects
        projects = await projectService.findAll({ consultantId: userId });
      } else if (userRole === UserRole.AUXILIARY) {
        // Auxiliaries see assigned projects
        projects = await projectService.findAll({ auxiliaryId: userId });
      } else {
        // Clients see projects they're part of
        projects = await projectService.findByClientId(userId);
      }

      // Enrich with client info
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const clientIds = await projectService.getProjectClients(project.id);
          return {
            ...project,
            clientIds,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedProjects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id
   * Get project by ID with full details
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const project = await projectService.findById(id);

      if (!project) {
        throw new NotFoundError('Projeto não encontrado');
      }

      // Check access
      const hasAccess = await projectService.hasAccess(id, userId, userRole);
      if (!hasAccess) {
        throw new ForbiddenError('Você não tem acesso a este projeto');
      }

      // Get related data
      const [phases, clientIds, activityLog] = await Promise.all([
        projectService.getPhases(id),
        projectService.getProjectClients(id),
        projectService.getActivityLog(id),
      ]);

      // Get tasks and documents for each phase
      const phasesWithDetails = await Promise.all(
        phases.map(async (phase) => {
          const [tasks, documents] = await Promise.all([
            taskService.findByPhaseWithDetails(phase.id),
            documentService.findByPhase(id, phase.id),
          ]);
          return {
            ...phase,
            tasks,
            documents,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          ...project,
          clientIds,
          phases: phasesWithDetails,
          activityLog,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects
   * Create a new project with clients
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, mainClient, additionalClients = [], contractFile } = req.body;
      const consultantId = req.user!.userId;

      // Create main client user
      const mainClientPassword = mainClient.password || generateRandomPassword();
      const mainClientUser = await userService.create({
        name: mainClient.name,
        email: mainClient.email,
        password: mainClientPassword,
        role: UserRole.CLIENT,
        clientType: mainClient.clientType,
        requiresPasswordChange: true,
      });

      const clientIds = [mainClientUser.id];

      // Create additional clients
      for (const client of additionalClients) {
        const clientPassword = client.password || generateRandomPassword();
        const clientUser = await userService.create({
          name: client.name,
          email: client.email,
          password: clientPassword,
          role: UserRole.CLIENT,
          clientType: client.clientType,
          requiresPasswordChange: true,
        });
        clientIds.push(clientUser.id);
      }

      // Create project
      const project = await projectService.create({
        name,
        consultantId,
        clientIds,
      });

      res.status(201).json({
        success: true,
        data: project,
        message: 'Projeto criado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/projects/:id
   * Update project
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, status, currentPhaseId, auxiliaryId, postCompletionStatus } = req.body;
      const userId = req.user!.userId;

      const project = await projectService.update(
        id,
        { name, status, currentPhaseId, auxiliaryId, postCompletionStatus },
        userId
      );

      res.status(200).json({
        success: true,
        data: project,
        message: 'Projeto atualizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:id
   * Delete project
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await projectService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Projeto deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:id/advance-phase
   * Advance to next phase
   */
  async advancePhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { phaseNumber } = req.body;
      const userId = req.user!.userId;

      const project = await projectService.advancePhase(id, phaseNumber, userId);

      res.status(200).json({
        success: true,
        data: project,
        message: 'Fase avançada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/projects/:id/phases/:phaseNumber
   * Update phase data
   */
  async updatePhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, phaseNumber } = req.params;
      const { status, phaseData, phase_data } = req.body;
      const phaseDataFinal = phaseData || phase_data;

      const phase = await projectService.updatePhase(id, parseInt(phaseNumber), {
        status,
        phaseData: phaseDataFinal,
      });

      res.status(200).json({
        success: true,
        data: phase,
        message: 'Fase atualizada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:id/clients
   * Add client to project
   */
  async addClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, name, email, clientType, password } = req.body;

      let clientId = userId;

      // If creating new client
      if (!userId && name && email) {
        const clientPassword = password || generateRandomPassword();
        const newClient = await userService.create({
          name,
          email,
          password: clientPassword,
          role: UserRole.CLIENT,
          clientType,
          requiresPasswordChange: true,
        });
        clientId = newClient.id;
      }

      await projectService.addClient(id, clientId);
      await projectService.addLogEntry(id, req.user!.userId, 'adicionou um membro ao projeto.');

      res.status(200).json({
        success: true,
        message: 'Cliente adicionado ao projeto com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:id/clients/:userId
   * Remove client from project
   */
  async removeClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, userId } = req.params;

      await projectService.removeClient(id, userId);
      await projectService.addLogEntry(id, req.user!.userId, 'removeu um membro do projeto.');

      res.status(200).json({
        success: true,
        message: 'Cliente removido do projeto com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id/chat/:chatType
   * Get project chat messages
   */
  async getChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, chatType } = req.params;

      const messages = await chatService.getProjectMessages(id, chatType as any);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:id/chat/:chatType
   * Send message to project chat
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, chatType } = req.params;
      const { content, phaseId } = req.body;
      const userId = req.user!.userId;

      const message = await chatService.sendMessage({
        projectId: id,
        chatType: chatType as any,
        phaseId,
        authorId: userId,
        content,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id/activity-log
   * Get project activity log
   */
  async getActivityLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const log = await projectService.getActivityLog(id);

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();

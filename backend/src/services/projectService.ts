// ===========================================
// Planejar Patrimônio - Project Service
// ===========================================

import { query, queryOne, transaction } from '../config/database.js';
import { Project, Phase, ProjectStatus, PhaseStatus, UserRole } from '../types/index.js';
import { generateId, transformRow, transformRows } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { userService } from './userService.js';

// Phase definitions (based on frontend constants)
const PHASE_DEFINITIONS = [
  { number: 1, title: 'Diagnóstico e Planejamento', description: 'Coleta de informações iniciais e definição dos objetivos da holding.' },
  { number: 2, title: 'Constituição da Holding', description: 'Definição do quadro societário, elaboração do contrato social e registro da empresa.' },
  { number: 3, title: 'Coleta de Dados para Integralização', description: 'Declaração dos bens que serão transferidos para o capital social da holding.' },
  { number: 4, title: 'Minuta de Integralização', description: 'Elaboração e revisão da minuta do contrato de integralização dos bens.' },
  { number: 5, title: 'Pagamento do ITBI', description: 'Processamento do Imposto sobre Transmissão de Bens Imóveis (ITBI), se aplicável.' },
  { number: 6, title: 'Registro da Integralização', description: 'Registro da transferência dos bens no cartório de registro de imóveis competente.' },
  { number: 7, title: 'Conclusão e Entrega', description: 'Entrega do dossiê final com todos os documentos e registros concluídos.' },
  { number: 8, title: 'Transferência de Quotas', description: 'Processo de doação ou venda de quotas sociais para herdeiros ou terceiros.' },
  { number: 9, title: 'Acordo de Sócios', description: 'Elaboração do acordo para regular as relações entre os sócios da holding.' },
  { number: 10, title: 'Suporte e Alterações', description: 'Canal para solicitações de alterações, dúvidas e suporte contínuo após a conclusão do projeto.' },
];

export class ProjectService {
  /**
   * Find project by ID
   */
  async findById(id: string): Promise<Project | null> {
    const row = await queryOne(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    return row ? transformRow<Project>(row) : null;
  }

  /**
   * Get all projects
   */
  async findAll(filters?: {
    status?: ProjectStatus;
    consultantId?: string;
    auxiliaryId?: string;
  }): Promise<Project[]> {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.consultantId) {
      sql += ' AND consultant_id = ?';
      params.push(filters.consultantId);
    }

    if (filters?.auxiliaryId) {
      sql += ' AND auxiliary_id = ?';
      params.push(filters.auxiliaryId);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = await query(sql, params);
    return transformRows<Project>(rows);
  }

  /**
   * Get projects for a client
   */
  async findByClientId(clientId: string): Promise<Project[]> {
    const rows = await query(
      `SELECT p.* FROM projects p
       INNER JOIN project_clients pc ON p.id = pc.project_id
       WHERE pc.user_id = ?
       ORDER BY p.created_at DESC`,
      [clientId]
    );
    return transformRows<Project>(rows);
  }

  /**
   * Get project clients
   */
  async getProjectClients(projectId: string): Promise<string[]> {
    const rows = await query(
      'SELECT user_id FROM project_clients WHERE project_id = ?',
      [projectId]
    );
    return rows.map((r: any) => r.user_id);
  }

  /**
   * Create a new project with initial phases
   */
  async create(data: {
    name: string;
    consultantId: string;
    clientIds: string[];
    auxiliaryId?: string;
  }): Promise<Project> {
    return await transaction(async (connection) => {
      const projectId = generateId();

      // Create project
      await connection.execute(
        `INSERT INTO projects (id, name, status, current_phase_id, consultant_id, auxiliary_id)
         VALUES (?, ?, 'in-progress', 1, ?, ?)`,
        [projectId, data.name, data.consultantId, data.auxiliaryId || null]
      );

      // Add clients to project
      for (const clientId of data.clientIds) {
        const pcId = generateId();
        await connection.execute(
          'INSERT INTO project_clients (id, project_id, user_id) VALUES (?, ?, ?)',
          [pcId, projectId, clientId]
        );
      }

      // Create all 10 phases
      for (const phase of PHASE_DEFINITIONS) {
        const phaseId = generateId();
        const status: PhaseStatus = phase.number === 1 ? 'in-progress' : 'pending';
        const phaseData = this.getInitialPhaseData(phase.number);

        await connection.execute(
          `INSERT INTO phases (id, project_id, phase_number, title, description, status, phase_data)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [phaseId, projectId, phase.number, phase.title, phase.description, status, JSON.stringify(phaseData)]
        );
      }

      // Add activity log
      const logId = generateId();
      await connection.execute(
        'INSERT INTO activity_log (id, project_id, actor_id, action) VALUES (?, ?, ?, ?)',
        [logId, projectId, data.consultantId, 'criou o projeto.']
      );

      return (await this.findById(projectId))!;
    });
  }

  /**
   * Update project
   */
  async update(id: string, data: Partial<Project>, actorId?: string): Promise<Project> {
    const project = await this.findById(id);
    if (!project) {
      throw new NotFoundError('Projeto não encontrado');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.currentPhaseId !== undefined) {
      updates.push('current_phase_id = ?');
      params.push(data.currentPhaseId);
    }

    if (data.auxiliaryId !== undefined) {
      updates.push('auxiliary_id = ?');
      params.push(data.auxiliaryId);
    }

    if (data.postCompletionStatus !== undefined) {
      updates.push('post_completion_status = ?');
      params.push(data.postCompletionStatus);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Log phase advancement if currentPhaseId changed
      if (data.currentPhaseId && data.currentPhaseId !== project.currentPhaseId && actorId) {
        const phase = await this.getPhase(id, data.currentPhaseId);
        if (phase) {
          await this.addLogEntry(id, actorId, `avançou o projeto para a Fase ${data.currentPhaseId}: ${phase.title}.`);
        }
      }
    }

    return (await this.findById(id))!;
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<void> {
    const project = await this.findById(id);
    if (!project) {
      throw new NotFoundError('Projeto não encontrado');
    }

    await query('DELETE FROM projects WHERE id = ?', [id]);
  }

  /**
   * Add client to project
   */
  async addClient(projectId: string, userId: string): Promise<void> {
    const id = generateId();
    await query(
      'INSERT INTO project_clients (id, project_id, user_id) VALUES (?, ?, ?)',
      [id, projectId, userId]
    );
  }

  /**
   * Remove client from project
   */
  async removeClient(projectId: string, userId: string): Promise<void> {
    await query(
      'DELETE FROM project_clients WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
  }

  /**
   * Get project phases
   */
  async getPhases(projectId: string): Promise<Phase[]> {
    const rows = await query(
      'SELECT * FROM phases WHERE project_id = ? ORDER BY phase_number ASC',
      [projectId]
    );
    return transformRows<Phase>(rows).map(phase => ({
      ...phase,
      phaseData: phase.phaseData 
        ? (typeof phase.phaseData === 'string' ? JSON.parse(phase.phaseData) : phase.phaseData)
        : null,
    }));
  }

  /**
   * Get specific phase
   */
  async getPhase(projectId: string, phaseNumber: number): Promise<Phase | null> {
    const row = await queryOne(
      'SELECT * FROM phases WHERE project_id = ? AND phase_number = ?',
      [projectId, phaseNumber]
    );
    if (!row) return null;

    const phase = transformRow<Phase>(row);
    return {
      ...phase,
      phaseData: phase.phaseData 
        ? (typeof phase.phaseData === 'string' ? JSON.parse(phase.phaseData) : phase.phaseData)
        : null,
    };
  }

  /**
   * Update phase
   */
  async updatePhase(projectId: string, phaseNumber: number, data: {
    status?: PhaseStatus;
    phaseData?: any;
  }): Promise<Phase> {
    const phase = await this.getPhase(projectId, phaseNumber);
    if (!phase) {
      throw new NotFoundError('Fase não encontrada');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.phaseData !== undefined) {
      updates.push('phase_data = ?');
      params.push(JSON.stringify(data.phaseData));
    }

    if (updates.length > 0) {
      params.push(projectId, phaseNumber);
      await query(
        `UPDATE phases SET ${updates.join(', ')} WHERE project_id = ? AND phase_number = ?`,
        params
      );
    }

    return (await this.getPhase(projectId, phaseNumber))!;
  }

  /**
   * Advance to next phase
   */
  async advancePhase(projectId: string, currentPhaseNumber: number, actorId: string): Promise<Project> {
    const project = await this.findById(projectId);
    if (!project) {
      throw new NotFoundError('Projeto não encontrado');
    }

    if (project.currentPhaseId !== currentPhaseNumber) {
      throw new ForbiddenError('Só é possível avançar a fase atual');
    }

    const nextPhaseNumber = currentPhaseNumber + 1;

    // Complete current phase
    await this.updatePhase(projectId, currentPhaseNumber, { status: 'completed' });

    // Start next phase (if exists)
    if (nextPhaseNumber <= 10) {
      await this.updatePhase(projectId, nextPhaseNumber, { status: 'in-progress' });
    }

    // Update project current phase
    await this.update(projectId, { currentPhaseId: nextPhaseNumber });

    // Log action
    await this.addLogEntry(projectId, actorId, `concluiu e avançou a Fase ${currentPhaseNumber}.`);

    return (await this.findById(projectId))!;
  }

  /**
   * Add activity log entry
   */
  async addLogEntry(projectId: string, actorId: string, action: string): Promise<void> {
    const id = generateId();
    await query(
      'INSERT INTO activity_log (id, project_id, actor_id, action) VALUES (?, ?, ?, ?)',
      [id, projectId, actorId, action]
    );
  }

  /**
   * Get activity log
   */
  async getActivityLog(projectId: string): Promise<any[]> {
    const rows = await query(
      `SELECT al.*, u.name as actor_name
       FROM activity_log al
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE al.project_id = ?
       ORDER BY al.created_at DESC`,
      [projectId]
    );
    return transformRows(rows);
  }

  /**
   * Check if user has access to project
   */
  async hasAccess(projectId: string, userId: string, role: UserRole): Promise<boolean> {
    const project = await this.findById(projectId);
    if (!project) return false;

    // Admins have access to all projects
    if (role === UserRole.ADMINISTRATOR) return true;

    // Consultant has access to their projects
    if (role === UserRole.CONSULTANT && project.consultantId === userId) return true;

    // Auxiliary has access to assigned projects
    if (role === UserRole.AUXILIARY && project.auxiliaryId === userId) return true;

    // Clients have access to their projects
    if (role === UserRole.CLIENT) {
      const clientIds = await this.getProjectClients(projectId);
      return clientIds.includes(userId);
    }

    return false;
  }

  /**
   * Get initial phase data based on phase number
   */
  private getInitialPhaseData(phaseNumber: number): any {
    switch (phaseNumber) {
      case 1:
        return { isFormCompleted: false, meetingScheduled: false };
      case 2:
        return {
          companyData: { name: '', capital: '', type: '', address: '', cnaes: '' },
          partners: [],
          documents: {},
          status: 'pending_client',
          processStatus: 'pending_start'
        };
      case 3:
        return { assets: [], documents: [], status: 'pending_client' };
      case 4:
        return { analysisDrafts: [], discussion: [], status: 'pending_draft', approvals: {} };
      case 5:
        return { itbiProcesses: [] };
      case 6:
        return { registrationProcesses: [] };
      case 7:
        return { status: 'pending' };
      case 8:
        return { transferProcesses: [] };
      case 9:
        return { drafts: [], discussion: [], status: 'pending_draft', approvals: {}, documents: {}, includedClauses: [] };
      case 10:
        return { requests: [] };
      default:
        return {};
    }
  }
}

export const projectService = new ProjectService();

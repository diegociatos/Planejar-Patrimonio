// ===========================================
// Planejar Patrimônio - Document Controller
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/documentService.js';
import { projectService } from '../services/projectService.js';
import { NotFoundError } from '../utils/errors.js';
import { env } from '../config/env.js';
import path from 'path';

export class DocumentController {
  /**
   * GET /api/projects/:projectId/documents
   * Get all documents for a project
   */
  async getByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;

      const documents = await documentService.findByProjectWithUploader(projectId);

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/phases/:phaseNumber/documents
   * Get documents for a phase
   */
  async getByPhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, phaseNumber } = req.params;

      const phase = await projectService.getPhase(projectId, parseInt(phaseNumber));
      if (!phase) {
        throw new NotFoundError('Fase não encontrada');
      }

      const documents = await documentService.findByPhase(projectId, phase.id);

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/phases/:phaseNumber/documents
   * Upload document to a phase
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, phaseNumber } = req.params;
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        throw new NotFoundError('Nenhum arquivo enviado');
      }

      const phase = await projectService.getPhase(projectId, parseInt(phaseNumber));
      if (!phase) {
        throw new NotFoundError('Fase não encontrada');
      }

      // Create document record
      const document = await documentService.create({
        phaseId: phase.id,
        projectId,
        name: file.originalname,
        url: path.join(env.upload.dir, file.filename),
        uploadedBy: userId,
      });

      // Add activity log
      await projectService.addLogEntry(
        projectId,
        userId,
        `enviou o documento "${file.originalname}" na Fase ${phaseNumber}.`
      );

      res.status(201).json({
        success: true,
        data: document,
        message: 'Documento enviado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id
   * Get document by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const document = await documentService.findById(id);

      if (!document) {
        throw new NotFoundError('Documento não encontrado');
      }

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/download
   * Download document file
   */
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const document = await documentService.findById(id);

      if (!document) {
        throw new NotFoundError('Documento não encontrado');
      }

      // Send file
      res.download(document.url, document.name);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/versions
   * Get document versions
   */
  async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const document = await documentService.findById(id);

      if (!document) {
        throw new NotFoundError('Documento não encontrado');
      }

      const versions = await documentService.getVersions(document.phaseId, document.name);

      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/documents/:id
   * Delete document
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { deleteFile } = req.query;

      await documentService.delete(id, deleteFile === 'true');

      res.status(200).json({
        success: true,
        message: 'Documento removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();

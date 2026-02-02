// ===========================================
// Planejar Patrimônio - Document Service
// ===========================================

import { query, queryOne } from '../config/database.js';
import { Document, DocumentType, DocumentStatus } from '../types/index.js';
import { generateId, transformRow, transformRows } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';

export class DocumentService {
  /**
   * Find document by ID
   */
  async findById(id: string): Promise<Document | null> {
    const row = await queryOne(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );
    return row ? transformRow<Document>(row) : null;
  }

  /**
   * Get documents by project
   */
  async findByProject(projectId: string): Promise<Document[]> {
    const rows = await query(
      `SELECT * FROM documents 
       WHERE project_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
      [projectId]
    );
    return transformRows<Document>(rows);
  }

  /**
   * Get documents by phase
   */
  async findByPhase(projectId: string, phaseId: string): Promise<Document[]> {
    const rows = await query(
      `SELECT * FROM documents 
       WHERE project_id = ? AND phase_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
      [projectId, phaseId]
    );
    return transformRows<Document>(rows);
  }

  /**
   * Create document record
   */
  async create(data: {
    phaseId: string;
    projectId: string;
    name: string;
    url: string;
    type?: DocumentType;
    uploadedBy: string;
  }): Promise<Document> {
    const id = generateId();
    
    // Determine file type from extension
    let type: DocumentType = data.type || 'other';
    if (!data.type) {
      const ext = path.extname(data.name).toLowerCase();
      if (ext === '.pdf') type = 'pdf';
      else if (['.doc', '.docx'].includes(ext)) type = 'doc';
    }

    // Get current max version for this file name in this phase
    const existingDoc = await queryOne<any>(
      `SELECT MAX(version) as maxVersion FROM documents 
       WHERE phase_id = ? AND name = ? AND status = 'active'`,
      [data.phaseId, data.name]
    );
    const version = (existingDoc?.maxVersion || 0) + 1;

    // If there's a previous version, mark it as deprecated
    if (version > 1) {
      await query(
        `UPDATE documents SET status = 'deprecated' 
         WHERE phase_id = ? AND name = ? AND status = 'active'`,
        [data.phaseId, data.name]
      );
    }

    await query(
      `INSERT INTO documents (id, phase_id, project_id, name, url, type, uploaded_by, version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, data.phaseId, data.projectId, data.name, data.url, type, data.uploadedBy, version]
    );

    return (await this.findById(id))!;
  }

  /**
   * Update document status
   */
  async updateStatus(id: string, status: DocumentStatus): Promise<Document> {
    const doc = await this.findById(id);
    if (!doc) {
      throw new NotFoundError('Documento não encontrado');
    }

    await query(
      'UPDATE documents SET status = ? WHERE id = ?',
      [status, id]
    );

    return (await this.findById(id))!;
  }

  /**
   * Delete document (mark as deprecated and optionally delete file)
   */
  async delete(id: string, deleteFile: boolean = false): Promise<void> {
    const doc = await this.findById(id);
    if (!doc) {
      throw new NotFoundError('Documento não encontrado');
    }

    // Mark as deprecated
    await query('UPDATE documents SET status = ? WHERE id = ?', ['deprecated', id]);

    // Optionally delete physical file
    if (deleteFile && doc.url.startsWith(env.upload.dir)) {
      try {
        await fs.unlink(doc.url);
      } catch (error) {
        // File might already be deleted, ignore error
        console.error('Error deleting file:', error);
      }
    }
  }

  /**
   * Get document versions
   */
  async getVersions(phaseId: string, name: string): Promise<Document[]> {
    const rows = await query(
      `SELECT * FROM documents 
       WHERE phase_id = ? AND name = ?
       ORDER BY version DESC`,
      [phaseId, name]
    );
    return transformRows<Document>(rows);
  }

  /**
   * Get all documents with uploader info
   */
  async findByProjectWithUploader(projectId: string): Promise<any[]> {
    const rows = await query(
      `SELECT d.*, u.name as uploader_name, p.phase_number, p.title as phase_title
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN phases p ON d.phase_id = p.id
       WHERE d.project_id = ? AND d.status = 'active'
       ORDER BY d.created_at DESC`,
      [projectId]
    );
    return transformRows(rows);
  }
}

export const documentService = new DocumentService();

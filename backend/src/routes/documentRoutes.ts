// ===========================================
// Planejar Patrimônio - Document Routes
// ===========================================

import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get document by ID
router.get('/:id', documentController.getById.bind(documentController));

// Download document
router.get('/:id/download', documentController.download.bind(documentController));

// Get document versions
router.get('/:id/versions', documentController.getVersions.bind(documentController));

// Delete document
router.delete('/:id', documentController.delete.bind(documentController));

export default router;

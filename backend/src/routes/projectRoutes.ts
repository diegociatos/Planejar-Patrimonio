// ===========================================
// Planejar Patrimônio - Project Routes
// ===========================================

import { Router } from 'express';
import { body } from 'express-validator';
import { projectController } from '../controllers/projectController.js';
import { taskController } from '../controllers/taskController.js';
import { documentController } from '../controllers/documentController.js';
import { authenticate, isConsultantOrAdmin, isStaff } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all projects
router.get('/', projectController.getAll.bind(projectController));

// Get project by ID
router.get('/:id', projectController.getById.bind(projectController));

// Create project (consultants and admins)
router.post(
  '/',
  isConsultantOrAdmin,
  validate([
    body('name').notEmpty().withMessage('Nome do projeto é obrigatório'),
    body('mainClient.name').notEmpty().withMessage('Nome do cliente principal é obrigatório'),
    body('mainClient.email').isEmail().withMessage('E-mail do cliente principal inválido'),
    body('mainClient.clientType').isIn(['partner', 'interested']).withMessage('Tipo de cliente inválido'),
  ]),
  projectController.create.bind(projectController)
);

// Update project
router.put(
  '/:id',
  isStaff,
  projectController.update.bind(projectController)
);

// Delete project (consultants and admins)
router.delete(
  '/:id',
  isConsultantOrAdmin,
  projectController.delete.bind(projectController)
);

// Advance phase
router.post(
  '/:id/advance-phase',
  isStaff,
  validate([
    body('phaseNumber').isInt({ min: 1, max: 10 }).withMessage('Número da fase inválido'),
  ]),
  projectController.advancePhase.bind(projectController)
);

// Update phase
router.put(
  '/:id/phases/:phaseNumber',
  projectController.updatePhase.bind(projectController)
);

// Project clients
router.post(
  '/:id/clients',
  isConsultantOrAdmin,
  projectController.addClient.bind(projectController)
);

router.delete(
  '/:id/clients/:userId',
  isConsultantOrAdmin,
  projectController.removeClient.bind(projectController)
);

// Project chat
router.get(
  '/:id/chat/:chatType',
  projectController.getChat.bind(projectController)
);

router.post(
  '/:id/chat/:chatType',
  validate([
    body('content').notEmpty().withMessage('Mensagem não pode ser vazia'),
  ]),
  projectController.sendMessage.bind(projectController)
);

// Activity log
router.get(
  '/:id/activity-log',
  projectController.getActivityLog.bind(projectController)
);

// Phase tasks
router.get(
  '/:projectId/phases/:phaseNumber/tasks',
  taskController.getByPhase.bind(taskController)
);

router.post(
  '/:projectId/phases/:phaseNumber/tasks',
  validate([
    body('description').notEmpty().withMessage('Descrição da tarefa é obrigatória'),
  ]),
  taskController.create.bind(taskController)
);

// Phase documents
router.get(
  '/:projectId/phases/:phaseNumber/documents',
  documentController.getByPhase.bind(documentController)
);

router.post(
  '/:projectId/phases/:phaseNumber/documents',
  uploadSingle,
  documentController.upload.bind(documentController)
);

// All project documents
router.get(
  '/:projectId/documents',
  documentController.getByProject.bind(documentController)
);

export default router;

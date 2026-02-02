// ===========================================
// Planejar Patrimônio - Task Routes
// ===========================================

import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my tasks
router.get('/', taskController.getMyTasks.bind(taskController));

// Update task
router.put('/:id', taskController.update.bind(taskController));

// Complete task
router.post('/:id/complete', taskController.complete.bind(taskController));

// Approve task
router.post('/:id/approve', taskController.approve.bind(taskController));

// Delete task
router.delete('/:id', taskController.delete.bind(taskController));

export default router;

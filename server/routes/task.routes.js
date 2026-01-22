import express from 'express';
import { body } from 'express-validator';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  markTaskComplete,
  addSubtask,
  toggleSubtask,
  addComment,
  getMyTasks
} from '../controllers/task.controller.js';
import { authenticate, agentAndAbove } from '../middleware/auth.middleware.js';

const router = express.Router();

// All authenticated users can manage tasks
router.get('/', authenticate, agentAndAbove, getAllTasks);
router.get('/my/tasks', authenticate, agentAndAbove, getMyTasks);
router.get('/:id', authenticate, agentAndAbove, getTaskById);

router.post('/', authenticate, agentAndAbove, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601().withMessage('Valid date is required')
], createTask);

router.put('/:id', authenticate, agentAndAbove, updateTask);
router.delete('/:id', authenticate, agentAndAbove, deleteTask);
router.patch('/:id/complete', authenticate, agentAndAbove, markTaskComplete);

// Subtasks
router.post('/:id/subtasks', authenticate, agentAndAbove, [
  body('title').trim().notEmpty().withMessage('Subtask title is required')
], addSubtask);

router.patch('/:id/subtasks/:subtaskId/toggle', authenticate, agentAndAbove, toggleSubtask);

// Comments
router.post('/:id/comments', authenticate, agentAndAbove, [
  body('text').trim().notEmpty().withMessage('Comment text is required')
], addComment);

export default router;

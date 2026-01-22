import express from 'express';
import { body } from 'express-validator';
import {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  getAgentStats
} from '../controllers/agent.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin and Super Admin routes
router.get('/', authenticate, adminOnly, getAllAgents);
router.get('/:id', authenticate, adminOnly, getAgentById);
router.get('/:id/stats', authenticate, adminOnly, getAgentStats);

router.post('/', authenticate, adminOnly, [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('licenseNumber').optional().trim(),
  body('specialization').optional().isArray()
], createAgent);

router.put('/:id', authenticate, adminOnly, updateAgent);
router.delete('/:id', authenticate, adminOnly, deleteAgent);

export default router;

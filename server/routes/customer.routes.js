import express from 'express';
import { body } from 'express-validator';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  assignAgent,
  addNote,
  getMyCustomers,
  getDueFollowUpsCount,
  getDueFollowUps,
  moveCustomer,
  getForeignCustomers,
  agentCloseCustomer,
  reopenCustomer
} from '../controllers/customer.controller.js';
import { authenticate, adminOnly, agentAndAbove } from '../middleware/auth.middleware.js';

const router = express.Router();

// Agent and above routes
router.get('/', authenticate, agentAndAbove, getAllCustomers);
router.get('/my/customers', authenticate, agentAndAbove, getMyCustomers);
router.get('/foreign/customers', authenticate, agentAndAbove, getForeignCustomers);
router.get('/follow-ups/due/count', authenticate, agentAndAbove, getDueFollowUpsCount);
router.get('/follow-ups/due', authenticate, agentAndAbove, getDueFollowUps);
router.get('/:id', authenticate, agentAndAbove, getCustomerById);

router.post('/', authenticate, agentAndAbove, [
  body('name').optional().trim(),
  body('email').optional().isEmail().withMessage('Valid email is required if provided'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
], createCustomer);

router.put('/:id', authenticate, agentAndAbove, updateCustomer);
router.post('/:id/notes', authenticate, agentAndAbove, [
  body('note').trim().notEmpty().withMessage('Note is required')
], addNote);

// Agent close - allows agents to close their own customers
router.put('/:id/agent-close', authenticate, agentAndAbove, agentCloseCustomer);

// Admin only routes
router.delete('/:id', authenticate, adminOnly, deleteCustomer);
router.patch('/:id/assign-agent', authenticate, adminOnly, [
  body('agentId').notEmpty().withMessage('Agent ID is required')
], assignAgent);
router.put('/:id/move', authenticate, agentAndAbove, moveCustomer);
router.put('/:id/reopen', authenticate, adminOnly, reopenCustomer);

export default router;

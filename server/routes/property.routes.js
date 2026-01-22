import express from 'express';
import { body } from 'express-validator';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  publishProperty,
  assignAgent,
  getMyProperties
} from '../controllers/property.controller.js';
import { authenticate, adminOnly, agentAndAbove, superAdminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProperties);
router.get('/:id', getPropertyById);

// Agent and above routes (view only for agents)
router.get('/my/properties', authenticate, agentAndAbove, getMyProperties);

// Admin and above routes (create, update, delete)
router.post('/', authenticate, adminOnly, [
  body('name').trim().notEmpty().withMessage('Property name is required'),
  body('description').optional().trim(),
  body('price').isNumeric().withMessage('Valid price is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').isIn(['Apartment', 'House', 'Duplex', 'Condo', 'Townhouse', 'Land', 'land', 'building', 'house', 'apartment', 'commercial', 'villa', 'penthouse']).withMessage('Valid type is required'),
  body('squareFeet').isNumeric().withMessage('Valid square feet is required')
], createProperty);

router.put('/:id', authenticate, adminOnly, updateProperty);

// Super Admin only routes
router.delete('/:id', authenticate, superAdminOnly, deleteProperty);
router.patch('/:id/publish', authenticate, superAdminOnly, publishProperty);
router.patch('/:id/assign-agent', authenticate, adminOnly, [
  body('agentId').notEmpty().withMessage('Agent ID is required')
], assignAgent);

export default router;

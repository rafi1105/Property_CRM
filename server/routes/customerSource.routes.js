import express from 'express';
import { body } from 'express-validator';
import {
  getAllSources,
  getAllSourcesAdmin,
  createSource,
  updateSource,
  deleteSource
} from '../controllers/customerSource.controller.js';
import { authenticate, adminOnly, superAdminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all active sources (for dropdown - all authenticated users)
router.get('/', authenticate, getAllSources);

// Get all sources including inactive (admin view)
router.get('/admin', authenticate, superAdminOnly, getAllSourcesAdmin);

// Create new source (super_admin only)
router.post('/', authenticate, superAdminOnly, [
  body('name').trim().notEmpty().withMessage('Source name is required')
], createSource);

// Update source (super_admin only)
router.put('/:id', authenticate, superAdminOnly, updateSource);

// Delete source (super_admin only)
router.delete('/:id', authenticate, superAdminOnly, deleteSource);

export default router;

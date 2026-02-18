import express from 'express';
import { body } from 'express-validator';
import {
  createReport,
  getAllReports,
  getReportsByZone,
  getMyReports,
  getTodayReport,
  getReportById,
  reviewReport,
  deleteReport,
  getReportStats
} from '../controllers/report.controller.js';
import { authenticate, adminOnly, agentAndAbove, superAdminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Agent routes
router.get('/my', authenticate, agentAndAbove, getMyReports);
router.get('/today', authenticate, agentAndAbove, getTodayReport);

router.post('/', authenticate, agentAndAbove, [
  body('content').trim().notEmpty().withMessage('Report content is required')
], createReport);

// Zonal Agent routes
router.get('/zone', authenticate, agentAndAbove, getReportsByZone);

// Admin and Super Admin routes
router.get('/', authenticate, adminOnly, getAllReports);
router.get('/stats', authenticate, adminOnly, getReportStats);
router.get('/:id', authenticate, agentAndAbove, getReportById);
router.patch('/:id/review', authenticate, adminOnly, reviewReport);
router.delete('/:id', authenticate, adminOnly, deleteReport);

export default router;

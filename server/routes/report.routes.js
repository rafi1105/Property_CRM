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

// Super Admin only routes
router.get('/', authenticate, superAdminOnly, getAllReports);
router.get('/stats', authenticate, superAdminOnly, getReportStats);
router.get('/:id', authenticate, agentAndAbove, getReportById);
router.patch('/:id/review', authenticate, superAdminOnly, reviewReport);
router.delete('/:id', authenticate, superAdminOnly, deleteReport);

export default router;

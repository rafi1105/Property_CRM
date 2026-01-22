import express from 'express';
import {
  getDashboardStats,
  getSuperAdminStats,
  getAdminStats,
  getAgentStats as getAgentDashboardStats
} from '../controllers/dashboard.controller.js';
import { authenticate, superAdminOnly, adminOnly, agentAndAbove } from '../middleware/auth.middleware.js';

const router = express.Router();

// General dashboard stats (role-based)
router.get('/stats', authenticate, agentAndAbove, getDashboardStats);

// Super Admin specific stats
router.get('/super-admin/stats', authenticate, superAdminOnly, getSuperAdminStats);

// Admin specific stats
router.get('/admin/stats', authenticate, adminOnly, getAdminStats);

// Agent specific stats
router.get('/agent/stats', authenticate, agentAndAbove, getAgentDashboardStats);

export default router;

import express from 'express';
import {
  createVisit,
  getAllVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
  getTodaysVisits,
  getMonthlyVisits,
  getTotalVisits
} from '../controllers/visit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticate);

// Create a new visit
router.post('/', createVisit);

// Get visit statistics
router.get('/stats/today', getTodaysVisits);
router.get('/stats/monthly', getMonthlyVisits);
router.get('/stats/total', getTotalVisits);

// Get all visits
router.get('/', getAllVisits);

// Get visit by ID
router.get('/:id', getVisitById);

// Update visit
router.put('/:id', updateVisit);

// Delete visit
router.delete('/:id', deleteVisit);

export default router;

import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  notifyMissedFollowUp
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Clear read notifications
router.delete('/clear-read', clearReadNotifications);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Delete single notification
router.delete('/:id', deleteNotification);

// Report missed follow-up
router.post('/missed-followup', notifyMissedFollowUp);

export default router;

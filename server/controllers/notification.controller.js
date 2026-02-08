import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { createBulkNotifications } from '../utils/notificationService.js';

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private (Agent/Admin/Super Admin)
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;

    const query = { recipient: req.user._id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      notifications,
      unreadCount,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
export const clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true
    });

    res.json({
      success: true,
      message: 'Read notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message
    });
  }
};

// @desc    Report missed follow-up to super admin
// @route   POST /api/notifications/missed-followup
// @access  Private
export const notifyMissedFollowUp = async (req, res) => {
  try {
    const { customerId, daysMissed, customerName, assignedAgent } = req.body;

    // Get all super admins
    const superAdmins = await User.find({
      role: 'super_admin',
      isActive: true
    }).select('_id');

    if (superAdmins.length === 0) {
      return res.json({
        success: true,
        message: 'No super admins to notify'
      });
    }

    const superAdminIds = superAdmins.map(admin => admin._id);

    // Check if notification already exists for this customer (to avoid duplicates)
    const existingNotification = await Notification.findOne({
      recipient: { $in: superAdminIds },
      type: 'missed_followup',
      'relatedEntity.entityId': customerId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    });

    if (existingNotification) {
      return res.json({
        success: true,
        message: 'Notification already sent recently'
      });
    }

    // Create notifications for all super admins
    await createBulkNotifications(superAdminIds, {
      type: 'missed_followup',
      title: '⚠️ Missed Follow-up Alert',
      message: `Follow-up missed for customer ${customerName} (${daysMissed} day${daysMissed > 1 ? 's' : ''} overdue)${assignedAgent ? ` - Assigned agent should be contacted` : ''}`,
      priority: 'high',
      relatedEntity: {
        entityType: 'Customer',
        entityId: customerId
      },
      actionUrl: `/dashboard/customers/${customerId}`,
      metadata: {
        customerName: customerName,
        daysMissed: daysMissed,
        assignedAgent: assignedAgent,
        reportedBy: req.user._id
      }
    });

    res.json({
      success: true,
      message: 'Missed follow-up notification sent to super admins'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending missed follow-up notification',
      error: error.message
    });
  }
};

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../utils/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      setNotifications(response.data?.notifications || response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    toast.success('Notifications refreshed');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(notifications.filter(n => n._id !== id));
      setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAllRead = async () => {
    try {
      await notificationAPI.clearRead();
      setNotifications(notifications.filter(n => !n.isRead));
      setShowDeleteConfirm(false);
      toast.success('All read notifications cleared');
    } catch (error) {
      toast.error('Failed to clear read notifications');
    }
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id));
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(selectedNotifications.map(id => notificationAPI.markAsRead(id)));
      setNotifications(notifications.map(n => 
        selectedNotifications.includes(n._id) ? { ...n, isRead: true } : n
      ));
      setSelectedNotifications([]);
      toast.success('Selected notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark selected as read');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedNotifications.map(id => notificationAPI.delete(id)));
      setNotifications(notifications.filter(n => !selectedNotifications.includes(n._id)));
      setSelectedNotifications([]);
      toast.success('Selected notifications deleted');
    } catch (error) {
      toast.error('Failed to delete selected notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'property_added':
      case 'property_assigned':
      case 'property_sold':
        return { icon: BuildingOfficeIcon, color: 'bg-purple-100 text-purple-600' };
      case 'customer_assigned':
      case 'customer_added':
      case 'customer_message':
      case 'high_value_lead':
        return { icon: UsersIcon, color: 'bg-blue-100 text-blue-600' };
      case 'task_assigned':
      case 'task_completed':
      case 'task_overdue':
      case 'urgent_task':
        return { icon: ClipboardDocumentListIcon, color: 'bg-green-100 text-green-600' };
      case 'deal_closed':
        return { icon: CheckCircleIcon, color: 'bg-emerald-100 text-emerald-600' };
      case 'agent_added':
        return { icon: UsersIcon, color: 'bg-indigo-100 text-indigo-600' };
      default:
        return { icon: BellIcon, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || colors.medium;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = notifications.filter(n => n.isRead).length;

  return (
    <DashboardLayout title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
      {/* Header Actions */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <FunnelIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: readCount }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs sm:text-sm flex items-center gap-1.5 ${
                  filter === f.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f.key ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-xs sm:text-sm transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 text-xs sm:text-sm transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            
            {readCount > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-xs sm:text-sm transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Clear read</span>
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-500">
              {selectedNotifications.length} selected
            </span>
            <button
              onClick={handleBulkMarkAsRead}
              className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              Mark read
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={() => setSelectedNotifications([])}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Select All Option */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
          />
          <span className="text-xs sm:text-sm text-gray-500">Select all</span>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredNotifications.map((notification) => {
            const { icon: Icon, color } = getNotificationIcon(notification.type);
            const isSelected = selectedNotifications.includes(notification._id);
            
            return (
              <div
                key={notification._id}
                className={`bg-white rounded-2xl p-3 sm:p-4 shadow-sm border transition-all cursor-pointer ${
                  notification.isRead 
                    ? 'border-gray-100 hover:border-gray-200' 
                    : 'border-purple-200 bg-purple-50/30 hover:border-purple-300'
                } ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectNotification(notification._id)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                  </div>

                  {/* Icon */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-medium text-sm sm:text-base ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span>
                          )}
                          {notification.priority && notification.priority !== 'medium' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          {notification.type && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {notification.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-100">
              <BellIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900">
                {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mt-2">
                {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Read Notifications?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete all {readCount} read notification{readCount !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllRead}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotificationsPage;

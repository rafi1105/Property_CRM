import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://property-crm-server.vercel.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/temp-admin-login', data), // Temporary endpoint
  firebaseAuth: (idToken, user) => api.post('/auth/firebase', { idToken, user }),
  getCurrentUser: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/users'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  createStaffUser: (data) => api.post('/auth/create-staff', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  toggleUserStatus: (id, isActive) => api.patch(`/auth/users/${id}/status`, { isActive })
};

// Property APIs
export const propertyAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getMyProperties: () => api.get('/properties/my/properties'),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  publish: (id) => api.patch(`/properties/${id}/publish`),
  assignAgent: (id, agentId) => api.patch(`/properties/${id}/assign-agent`, { agentId })
};

// Customer APIs
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getMyCustomers: (params) => api.get('/customers/my/customers', { params }),
  getForeignCustomers: (params) => api.get('/customers/foreign/customers', { params }),
  getDueFollowUpsCount: () => api.get('/customers/follow-ups/due/count'),
  getDueFollowUps: () => api.get('/customers/follow-ups/due'),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  assignAgent: (id, agentId) => api.patch(`/customers/${id}/assign-agent`, { agentId }),
  addNote: (id, data) => api.post(`/customers/${id}/notes`, data),
  editNote: (customerId, noteId, data) => api.put(`/customers/${customerId}/notes/${noteId}`, data),
  deleteNote: (customerId, noteId) => api.delete(`/customers/${customerId}/notes/${noteId}`),
  moveCustomer: (id, data) => api.put(`/customers/${id}/move`, data),
  agentCloseCustomer: (id, reason) => api.put(`/customers/${id}/agent-close`, { reason }),
  reopenCustomer: (id) => api.put(`/customers/${id}/reopen`)
};

// Customer Source APIs (for managing source dropdown options)
export const customerSourceAPI = {
  getAll: () => api.get('/customer-sources'),
  getAllAdmin: () => api.get('/customer-sources/admin'),
  create: (name) => api.post('/customer-sources', { name }),
  update: (id, data) => api.put(`/customer-sources/${id}`, data),
  delete: (id) => api.delete(`/customer-sources/${id}`)
};

// Task APIs
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  getMyTasks: (params) => api.get('/tasks/my/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  markComplete: (id) => api.patch(`/tasks/${id}/complete`),
  addSubtask: (id, title) => api.post(`/tasks/${id}/subtasks`, { title }),
  toggleSubtask: (id, subtaskId) => api.patch(`/tasks/${id}/subtasks/${subtaskId}/toggle`),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text })
};

// Agent APIs
export const agentAPI = {
  getAll: (params) => api.get('/agents', { params }),
  getById: (id) => api.get(`/agents/${id}`),
  getStats: (id) => api.get(`/agents/${id}/stats`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`)
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSuperAdminStats: () => api.get('/dashboard/super-admin/stats'),
  getAdminStats: () => api.get('/dashboard/admin/stats'),
  getAgentStats: () => api.get('/dashboard/agent/stats')
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read')
};

// Visit APIs
export const visitAPI = {
  getAll: (params) => api.get('/visits', { params }),
  getById: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post('/visits', data),
  update: (id, data) => api.put(`/visits/${id}`, data),
  delete: (id) => api.delete(`/visits/${id}`),
  getTodaysVisits: (agentId) => api.get('/visits/stats/today', { params: { agentId } }),
  getMonthlyVisits: (agentId) => api.get('/visits/stats/monthly', { params: { agentId } }),
  getTotalVisits: (agentId) => api.get('/visits/stats/total', { params: { agentId } })
};

// Report APIs
export const reportAPI = {
  // Agent endpoints
  create: (data) => api.post('/reports', data),
  getMyReports: (params) => api.get('/reports/my', { params }),
  getTodayReport: () => api.get('/reports/today'),
  
  // Zonal Agent endpoints
  getZoneReports: (params) => api.get('/reports/zone', { params }),
  
  // Super Admin endpoints
  getAll: (params) => api.get('/reports', { params }),
  getStats: () => api.get('/reports/stats'),
  getById: (id) => api.get(`/reports/${id}`),
  review: (id, data) => api.patch(`/reports/${id}/review`, data),
  delete: (id) => api.delete(`/reports/${id}`)
};

// Upload APIs - Uses PHP script directly for Hostinger storage
const UPLOAD_PHP_URL = '/api/upload.php';

export const uploadAPI = {
  uploadImages: (formData) => {
    const token = localStorage.getItem('token');
    return axios.post(UPLOAD_PHP_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
  },
  getAllImages: () => axios.get(UPLOAD_PHP_URL),
  deleteImage: (filename) => axios.delete(`${UPLOAD_PHP_URL}/${filename}`)
};

export default api;

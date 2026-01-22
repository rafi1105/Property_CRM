import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  adminLogin,
  firebaseAuth,
  getCurrentUser,
  updateProfile,
  changePassword,
  getAllUsers,
  createStaffUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/auth.controller.js';
import { authenticate, superAdminOnly, agentAndAbove } from '../middleware/auth.middleware.js';

const router = express.Router();

// Regular user registration (email/password)
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('address').optional().trim()
], register);

// Regular user login (email/password)
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// Admin/Agent login (JWT-based)
router.post('/admin/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['super_admin', 'admin', 'agent']).withMessage('Invalid role')
], adminLogin);

// Firebase authentication (Google sign-in for users)
router.post('/firebase', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required')
], firebaseAuth);

// Get current user (protected)
router.get('/me', authenticate, getCurrentUser);

// Update profile (protected)
router.put('/profile', authenticate, [
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim()
], updateProfile);

// Change password (protected)
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], changePassword);

// Get all users (Accessible by Agents, Admins, and Super Admins for assignment purposes)
router.get('/users', authenticate, agentAndAbove, getAllUsers);

// Create admin/agent user (Super Admin only)
router.post('/create-staff', authenticate, superAdminOnly, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('role').isIn(['admin', 'agent']).withMessage('Role must be admin or agent')
], createStaffUser);

// Update user (Super Admin only)
router.put('/users/:id', authenticate, superAdminOnly, updateUser);

// Delete user (Super Admin only)
router.delete('/users/:id', authenticate, superAdminOnly, deleteUser);

// Toggle user status (Super Admin only)
router.patch('/users/:id/status', authenticate, superAdminOnly, toggleUserStatus);

export default router;

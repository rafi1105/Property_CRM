import { validationResult } from 'express-validator';
import User from '../models/User.model.js';
import { generateTokenResponse } from '../utils/jwt.utils.js';
import { verifyFirebaseToken } from '../config/firebase.config.js';

// @desc    Register new user (email/password)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'user',
      authProvider: 'email'
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json(generateTokenResponse(user));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user (email/password)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user role is 'user' (not admin/agent)
    if (user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Please use admin login for this account'
      });
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json(generateTokenResponse(user));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Admin/Agent login (JWT-based)
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Find user
    const user = await User.findOne({ email, role }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json(generateTokenResponse(user));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: error.message
    });
  }
};

// @desc    Firebase authentication (Google sign-in)
// @route   POST /api/auth/firebase
// @access  Public
export const firebaseAuth = async (req, res) => {
  console.log('🔥 Firebase auth request received');
  console.log('Request body keys:', Object.keys(req.body));
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { idToken, user: firebaseUser } = req.body;
    
    if (!firebaseUser) {
      console.error('❌ No firebaseUser provided');
      return res.status(400).json({
        success: false,
        message: 'User data is required'
      });
    }
    
    console.log('Firebase user email:', firebaseUser.email);
    console.log('Firebase user UID:', firebaseUser.uid);

    // Try to verify with Firebase Admin if available, otherwise trust client
    let decodedToken;
    try {
      console.log('Attempting Firebase Admin verification...');
      decodedToken = await verifyFirebaseToken(idToken);
      console.log('✅ Firebase Admin verification successful');
    } catch (error) {
      console.warn('⚠️  Firebase Admin verification failed:', error.message);
      // Fallback to client-provided user data
      if (!firebaseUser.uid || !firebaseUser.email) {
        console.error('❌ Missing required user data');
        return res.status(400).json({
          success: false,
          message: 'Invalid user data: missing uid or email'
        });
      }
      decodedToken = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        picture: firebaseUser.photoURL
      };
      console.log('✅ Using client-provided user data');
    }

    console.log('Looking up user with UID:', decodedToken.uid);
    
    // Check if user exists
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      console.log('User not found, creating new user...');
      
      // Create new user from Firebase data
      const userData = {
        name: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        photoURL: decodedToken.picture || null,
        role: 'user',
        authProvider: 'google',
        isActive: true
      };
      
      console.log('Creating user with data:', userData);
      user = await User.create(userData);
      console.log('✅ New user created:', user._id);
    } else {
      console.log('✅ User found:', user._id);
      
      // Update photo URL if it changed
      if (decodedToken.picture && user.photoURL !== decodedToken.picture) {
        user.photoURL = decodedToken.picture;
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    console.log('✅ Firebase auth successful for user:', user.email);
    
    const response = generateTokenResponse(user);
    res.json(response);
  } catch (error) {
    console.error('❌ Firebase auth error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Firebase authentication failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, phone, address } = req.body;

    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Get all users (Super Admin only)
// @route   GET /api/auth/users
// @access  Private (Super Admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Create admin/agent user (Super Admin only)
// @route   POST /api/auth/create-staff
// @access  Super Admin only
export const createStaffUser = async (req, res) => {
  try {
    console.log('Received create-staff request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address, role, assignedZone, assignedThana } = req.body;
    
    console.log('Extracted values - Zone:', assignedZone, 'Thana:', assignedThana, 'Role:', role);

    // Validate role
    if (!['admin', 'agent'].includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Role must be either admin or agent'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create staff user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role,
      assignedZone: role === 'agent' ? assignedZone : undefined,
      assignedThana: role === 'agent' ? assignedThana : undefined,
      authProvider: 'email'
    });

    console.log('Staff user created successfully:', user.email);

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        assignedZone: user.assignedZone,
        assignedThana: user.assignedThana
      }
    });
  } catch (error) {
    console.error('Error creating staff user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user creation',
      error: error.message
    });
  }
};

// @desc    Update user (Super Admin only)
// @route   PUT /api/auth/users/:id
// @access  Super Admin only
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, isActive, assignedZone, assignedThana } = req.body;
    
    console.log('Update user request body:', req.body); // Debug log
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Handle zone and thana - set them if role is agent, clear them otherwise
    if (role === 'agent') {
      user.assignedZone = assignedZone || '';
      user.assignedThana = assignedThana || '';
    } else {
      // Clear zone and thana for non-agents
      user.assignedZone = '';
      user.assignedThana = '';
    }
    
    // Update password only if provided
    if (password) {
      user.password = password;
    }

    await user.save();
    
    console.log('User updated:', { zone: user.assignedZone, thana: user.assignedThana }); // Debug log

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        assignedZone: user.assignedZone,
        assignedThana: user.assignedThana
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user (Super Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Super Admin only
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Toggle user status (Super Admin only)
// @route   PATCH /api/auth/users/:id/status
// @access  Super Admin only
export const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

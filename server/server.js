import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// CORS configuration with environment-based origins
const allowedOrigins = process.env.CLIENT_URL ? 
  process.env.CLIENT_URL.split(',').map(url => url.trim()) : 
  ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // If in development, allow localhost
    if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
      return callback(null, true);
    }
    
    console.warn('CORS blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests explicitly with better logging
app.options('*', (req, res) => {
  console.log('Preflight request from:', req.get('origin'));
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.get('origin') || 'unknown'}`);
  next();
});

// MongoDB Connection with better error handling for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('âœ… Using existing MongoDB connection');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log('âœ… MongoDB Connected Successfully');
  } catch (err) {
    console.error('âŒ MongoDB Connection Error:', err.message);
    throw err;
  }
};

// Initialize connection
connectDB().catch(err => console.error('Initial DB connection failed:', err));

// Middleware to ensure DB connection before processing requests
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await connectDB();
    }
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sintec  Real Estate CRM API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      customers: '/api/customers',
      tasks: '/api/tasks',
      agents: '/api/agents',
      dashboard: '/api/dashboard',
      notifications: '/api/notifications',
      visits: '/api/visits',
      reports: '/api/reports'
    }
  });
});

// Test JWT endpoint
app.get('/api/test-jwt', async (req, res) => {
  try {
    const { generateToken } = await import('./utils/jwt.utils.js');
    const testToken = generateToken('test-user-id');
    res.json({
      success: true,
      message: 'JWT test successful',
      testToken,
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
      jwtExpire: process.env.JWT_EXPIRE || 'Not set'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'JWT test failed',
      error: error.message
    });
  }
});

// Simple test login
app.post('/api/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === 'test@test.com' && password === 'test123') {
      res.json({
        success: true,
        message: 'Simple test login successful',
        token: 'test-token-123',
        user: { id: 'test-id', email, name: 'Test User', role: 'super_admin' }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid test credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Simple login test failed',
      error: error.message
    });
  }
});

// Temporary working admin login
app.post('/api/auth/temp-admin-login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Accept the seeded admin accounts with simplified authentication
    if ((email === 'superadmin@realestate.com' && password === 'admin123') ||
        (email === 'rafikabir05.rk@gmail.com' && password === 'Rafi1234@')) {
      res.json({
        success: true,
        token: 'temp-admin-token-' + Date.now(),
        user: {
          id: 'temp-admin-id',
          name: email === 'superadmin@realestate.com' ? 'Super Admin' : 'Rafi Kabir',
          email: email,
          role: 'super_admin',
          phone: '+8801234567890',
          address: 'Dhaka, Bangladesh',
          isActive: true,
          authProvider: 'email'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Temporary admin login failed',
      error: error.message
    });
  }
});

// Temporary get current user endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (token && token.startsWith('temp-admin-token-')) {
      res.json({
        success: true,
        user: {
          id: 'temp-admin-id',
          name: 'Super Admin',
          email: 'superadmin@realestate.com',
          role: 'super_admin',
          phone: '+8801234567890',
          address: 'Dhaka, Bangladesh',
          isActive: true,
          authProvider: 'email'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting current user',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasFirebaseBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        hasClientUrl: !!process.env.CLIENT_URL,
        clientUrl: process.env.CLIENT_URL,
      },
      database: {
        status: dbStatus,
        connected: isConnected
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Test endpoint for Firebase auth debugging
app.post('/api/test-firebase', async (req, res) => {
  try {
    const User = (await import('./models/User.model.js')).default;
    const { verifyFirebaseToken } = await import('./config/firebase.config.js');
    
    res.json({
      success: true,
      message: 'Firebase test endpoint working',
      userModelLoaded: !!User,
      firebaseConfigLoaded: !!verifyFirebaseToken,
      body: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Firebase test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Import routes
import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/property.routes.js';
import customerRoutes from './routes/customer.routes.js';
import taskRoutes from './routes/task.routes.js';
import agentRoutes from './routes/agent.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import visitRoutes from './routes/visit.routes.js';
import reportRoutes from './routes/report.routes.js';

// Serve static files from uploads directory
// Use UPLOADS_DIR env variable for Hostinger or default to local uploads folder
const uploadsPath = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Only start the server if not in Vercel (Vercel handles this)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`ðŸš€ Server running on port ${PORT}`);
    console.log(`ðŸ“ Environment: ${process.env.NODE_ENV}`);
    console.log(`ðŸŒ Client URL: ${process.env.CLIENT_URL}`);
  });
}

// Export for Vercel serverless
export default app;

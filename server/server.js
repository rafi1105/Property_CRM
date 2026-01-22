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

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with better error handling for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
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
      dashboard: '/api/dashboard'
    }
  });
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  });
}

// Export for Vercel serverless
export default app;

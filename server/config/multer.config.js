import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use environment variable for uploads directory or default to local
// For Hostinger: Set UPLOADS_DIR in .env to your public_html/uploads path
const uploadsBase = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
const uploadsDir = path.join(uploadsBase, 'properties');

// Create uploads directory if it doesn't exist
const ensureUploadDir = () => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to create uploads directory:', error.message);
    return false;
  }
};

// Try to create directory on startup
ensureUploadDir();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before each upload
    if (!ensureUploadDir()) {
      return cb(new Error('Unable to create uploads directory. Check permissions.'), null);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-randomstring.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `property-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Maximum 10 files at once
  }
});

export default upload;

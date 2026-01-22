import express from 'express';
import upload from '../config/multer.config.js';
import { uploadImages, deleteImage, getAllImages } from '../controllers/upload.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Upload multiple images (max 10)
router.post('/images', authenticate, adminOnly, upload.array('images', 10), uploadImages);

// Get all uploaded images
router.get('/images', authenticate, adminOnly, getAllImages);

// Delete an image
router.delete('/images/:filename', authenticate, adminOnly, deleteImage);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof Error) {
    if (error.message === 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files at once.'
      });
    }
  }
  next(error);
});

export default router;

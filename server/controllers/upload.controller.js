import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get uploads directory from env or default
const getUploadsDir = () => {
  const uploadsBase = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
  return path.join(uploadsBase, 'properties');
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Admin/Super Admin
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Use UPLOADS_URL env variable for Hostinger or construct from host
    const baseUrl = process.env.UPLOADS_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrls = req.files.map(file => {
      return `${baseUrl}/uploads/properties/${file.filename}`;
    });

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully`,
      images: imageUrls,
      files: req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: `${baseUrl}/uploads/properties/${file.filename}`
      }))
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// @desc    Delete an uploaded image
// @route   DELETE /api/upload/images/:filename
// @access  Admin/Super Admin
export const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// @desc    Get all uploaded images
// @route   GET /api/upload/images
// @access  Admin/Super Admin
export const getAllImages = async (req, res) => {
  try {
    const uploadsDir = getUploadsDir();
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return res.status(200).json({
        success: true,
        images: []
      });
    }

    const files = fs.readdirSync(uploadsDir);
    const baseUrl = process.env.UPLOADS_URL || `${req.protocol}://${req.get('host')}`;
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `${baseUrl}/uploads/properties/${file}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      });

    res.status(200).json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting images',
      error: error.message
    });
  }
};

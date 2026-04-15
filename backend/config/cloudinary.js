/**
 * Cloudinary Configuration
 * Handles image upload settings
 */
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isPlaceholder = process.env.CLOUDINARY_API_KEY === 'placeholder';

// Create local uploads directory if it doesn't exist
if (isPlaceholder && !fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Storage config for product images
const storage = isPlaceholder
  ? multer.diskStorage({
      destination: (req, file, cb) => cb(null, 'uploads/'),
      filename: (req, file, cb) => cb(null, `product-${Date.now()}-${file.originalname}`),
    })
  : new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'student-marketplace/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
      },
    });

// Storage for avatar images
const avatarStorage = isPlaceholder
  ? multer.diskStorage({
      destination: (req, file, cb) => cb(null, 'uploads/'),
      filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${file.originalname}`),
    })
  : new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'student-marketplace/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }],
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

module.exports = { cloudinary, upload, uploadAvatar };

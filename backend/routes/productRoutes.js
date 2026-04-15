/**
 * Product Routes
 */
const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, markAsSold, getMyProducts, getRecommendations, getSellerProducts,
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getProducts);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/my/listings', protect, getMyProducts);
router.get('/seller/:sellerId', getSellerProducts);
router.get('/:id', optionalAuth, getProduct);

// Protected routes
router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, deleteProduct);
router.put('/:id/sold', protect, markAsSold);

module.exports = router;

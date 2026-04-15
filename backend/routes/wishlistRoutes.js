const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist, checkWishlist } = require('../controllers/wishlistRatingController');
const { protect } = require('../middleware/auth');

router.get('/check/:productId', protect, checkWishlist);
router.get('/', protect, getWishlist);
router.post('/:productId', protect, addToWishlist);
router.delete('/:productId', protect, removeFromWishlist);

module.exports = router;

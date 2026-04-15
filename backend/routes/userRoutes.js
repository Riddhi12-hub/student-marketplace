const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const { Wishlist, Rating } = require('../models/WishlistRating');
const { Conversation } = require('../models/Message');

// @desc  Get dashboard stats for logged-in user
// @route GET /api/users/dashboard
// @access Private
router.get('/dashboard', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [activeListings, soldItems, wishlistCount, ratings, conversations] = await Promise.all([
    Product.countDocuments({ seller: userId, isSold: false }),
    Product.countDocuments({ seller: userId, isSold: true }),
    Wishlist.countDocuments({ user: userId }),
    Rating.find({ seller: userId }).sort({ createdAt: -1 }).limit(5).populate('rater', 'name avatar').populate('product', 'title'),
    Conversation.countDocuments({ participants: userId }),
  ]);

  res.json({
    success: true,
    stats: {
      activeListings,
      soldItems,
      wishlistCount,
      totalRatings: req.user.totalRatings,
      averageRating: req.user.averageRating,
      isTrustedSeller: req.user.isTrustedSeller,
      conversations,
    },
    recentRatings: ratings,
  });
}));

module.exports = router;

/**
 * Wishlist Controller
 */
const { Wishlist, Rating } = require('../models/WishlistRating');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Check if already in wishlist
  const existing = await Wishlist.findOne({ user: req.user._id, product: productId });
  if (existing) {
    throw new AppError('Product is already in your wishlist', 409);
  }

  await Wishlist.create({ user: req.user._id, product: productId });

  res.status(201).json({ success: true, message: 'Added to wishlist' });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const item = await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

  if (!item) {
    throw new AppError('Product not found in wishlist', 404);
  }

  res.json({ success: true, message: 'Removed from wishlist' });
});

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({ user: req.user._id })
    .populate({
      path: 'product',
      populate: { path: 'seller', select: 'name avatar averageRating isTrustedSeller' },
    })
    .sort({ createdAt: -1 });

  // Filter out null products (deleted products)
  const validItems = wishlist.filter((item) => item.product !== null);

  res.json({ success: true, wishlist: validItems });
});

// @desc    Check if product is in user's wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
exports.checkWishlist = asyncHandler(async (req, res) => {
  const item = await Wishlist.findOne({
    user: req.user._id,
    product: req.params.productId,
  });

  res.json({ success: true, isWishlisted: !!item });
});

// ─── RATING CONTROLLER ────────────────────────────────────────────────────────

// @desc    Rate a seller
// @route   POST /api/ratings
// @access  Private
exports.rateSeller = asyncHandler(async (req, res) => {
  const { sellerId, productId, rating, comment } = req.body;

  // Can't rate yourself
  if (sellerId === req.user._id.toString()) {
    throw new AppError("You can't rate yourself", 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Check if already rated this seller for this product
  const existing = await Rating.findOne({
    seller: sellerId,
    rater: req.user._id,
    product: productId,
  });

  if (existing) {
    // Update existing rating
    existing.rating = rating;
    existing.comment = comment || '';
    await existing.save();
  } else {
    // Create new rating
    await Rating.create({
      seller: sellerId,
      rater: req.user._id,
      product: productId,
      rating,
      comment: comment || '',
    });
  }

  // Recalculate seller's average rating
  const stats = await Rating.aggregate([
    { $match: { seller: require('mongoose').Types.ObjectId.createFromHexString(sellerId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const seller = await User.findById(sellerId);
    seller.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    seller.totalRatings = stats[0].totalRatings;
    seller.updateTrustedStatus();
    await seller.save({ validateBeforeSave: false });
  }

  res.status(201).json({ success: true, message: 'Rating submitted successfully' });
});

// @desc    Get ratings for a seller
// @route   GET /api/ratings/seller/:sellerId
// @access  Public
exports.getSellerRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ seller: req.params.sellerId })
    .populate('rater', 'name avatar')
    .populate('product', 'title')
    .sort({ createdAt: -1 });

  res.json({ success: true, ratings });
});

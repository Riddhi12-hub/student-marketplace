/**
 * Product Controller
 * Full CRUD + search, filters, fraud detection, recommendations
 */
const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { cloudinary } = require('../config/cloudinary');

// ─── FRAUD DETECTION HELPERS ──────────────────────────────────────────────────

/**
 * Detect if a listing is a potential duplicate
 * Checks for same title + seller within 24 hours
 */
const checkDuplicate = async (title, sellerId, excludeId = null) => {
  const query = {
    seller: sellerId,
    title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Product.findOne(query);
  return existing;
};

/**
 * Detect unrealistic pricing based on category averages
 * Simple heuristic: flag if price is 10x higher than typical
 */
const checkUnrealisticPrice = (price, category) => {
  const categoryLimits = {
    Books: 5000,
    Electronics: 150000,
    Gadgets: 100000,
    'Notes & Study Material': 1000,
    Clothing: 10000,
    Sports: 20000,
    Furniture: 30000,
    Stationery: 2000,
    'Lab Equipment': 50000,
    Software: 30000,
    Other: 50000,
  };

  const limit = categoryLimits[category] || 50000;
  return price > limit;
};

// ─── GET ALL PRODUCTS ─────────────────────────────────────────────────────────

// @desc    Get all products with search, filters, pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    location,
    condition,
    isSold,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isFlagged: false };

  // Search by keyword (text index)
  if (search) {
    query.$text = { $search: search };
  }

  // Filter by category
  if (category && category !== 'All') {
    query.category = category;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Filter by location (case-insensitive partial match)
  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Filter by condition
  if (condition) {
    query.condition = condition;
  }

  // Filter sold status (default: show unsold items)
  if (isSold !== undefined) {
    query.isSold = isSold === 'true';
  } else {
    query.isSold = false;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortOptions = {
    '-createdAt': { createdAt: -1 },
    'createdAt': { createdAt: 1 },
    'price': { price: 1 },
    '-price': { price: -1 },
    '-views': { views: -1 },
  };

  const sortQuery = sortOptions[sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('seller', 'name avatar averageRating isTrustedSeller location college')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
      hasMore: pageNum < Math.ceil(total / limitNum),
    },
  });
});

// ─── GET SINGLE PRODUCT ───────────────────────────────────────────────────────

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name avatar averageRating totalRatings isTrustedSeller location college phone createdAt');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  // Track category view for logged in user (for recommendations)
  if (req.user) {
    const user = await User.findById(req.user._id);
    const catEntry = user.viewedCategories.find((v) => v.category === product.category);
    if (catEntry) {
      catEntry.count += 1;
    } else {
      user.viewedCategories.push({ category: product.category, count: 1 });
    }
    await user.save({ validateBeforeSave: false });
  }

  res.json({ success: true, product });
});

// ─── CREATE PRODUCT ───────────────────────────────────────────────────────────

// @desc    Create new product listing
// @route   POST /api/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, originalPrice, category, condition, location, tags } = req.body;

  // Build images array from uploaded files
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-url.com' 
    : `http://localhost:${process.env.PORT || 5000}`;

  const images = req.files
    ? req.files.map((file) => ({
        url: file.path.startsWith('uploads') || file.path.startsWith('uploads/') || file.path.startsWith('uploads\\') 
             ? `${serverUrl}/${file.path.replace(/\\/g, '/')}` 
             : file.path,
        publicId: file.filename || '',
      }))
    : [];

  if (images.length === 0 && req.body.imageUrl) {
    // Support single image URL fallback
    images.push({ url: req.body.imageUrl, publicId: '' });
  }

  // ─── Fraud Detection ──────────────────────────────────────────────
  const flagReasons = [];

  // Check for duplicate listing
  const duplicate = await checkDuplicate(title, req.user._id);
  if (duplicate) {
    flagReasons.push('DUPLICATE_LISTING');
  }

  // Check for unrealistic price
  if (checkUnrealisticPrice(Number(price), category)) {
    flagReasons.push('UNREALISTIC_PRICE');
  }

  const product = await Product.create({
    title,
    description,
    price: Number(price),
    originalPrice: Number(originalPrice) || 0,
    category,
    condition: condition || 'Good',
    images,
    location: location || req.user.location || '',
    seller: req.user._id,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    isFlagged: flagReasons.length > 0,
    flagReasons,
    duplicateOf: duplicate ? duplicate._id : null,
  });

  const populatedProduct = await product.populate('seller', 'name avatar averageRating isTrustedSeller');

  res.status(201).json({
    success: true,
    product: populatedProduct,
    fraudWarnings: flagReasons.length > 0 ? flagReasons : null,
  });
});

// ─── UPDATE PRODUCT ───────────────────────────────────────────────────────────

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (owner only)
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) throw new AppError('Product not found', 404);

  // Check ownership
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to edit this product', 403);
  }

  if (product.isSold) {
    throw new AppError('Cannot edit a sold product', 400);
  }

  const { title, description, price, originalPrice, category, condition, location, tags } = req.body;

  const updateData = {
    ...(title && { title }),
    ...(description && { description }),
    ...(price !== undefined && { price: Number(price) }),
    ...(originalPrice !== undefined && { originalPrice: Number(originalPrice) }),
    ...(category && { category }),
    ...(condition && { condition }),
    ...(location !== undefined && { location }),
    ...(tags && {
      tags: Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()),
    }),
  };

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    // Delete old images from Cloudinary
    for (const img of product.images) {
      if (img.publicId) {
        await cloudinary.uploader.destroy(img.publicId).catch(() => {});
      }
    }
    updateData.images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
  }

  // Re-run fraud detection if price or title changed
  if (title || price) {
    const flagReasons = [];
    const checkTitle = title || product.title;
    const checkPrice = price !== undefined ? Number(price) : product.price;
    const checkCategory = category || product.category;

    const duplicate = await checkDuplicate(checkTitle, req.user._id, product._id);
    if (duplicate) flagReasons.push('DUPLICATE_LISTING');
    if (checkUnrealisticPrice(checkPrice, checkCategory)) flagReasons.push('UNREALISTIC_PRICE');

    updateData.isFlagged = flagReasons.length > 0;
    updateData.flagReasons = flagReasons;
  }

  product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('seller', 'name avatar averageRating isTrustedSeller');

  res.json({ success: true, product });
});

// ─── DELETE PRODUCT ───────────────────────────────────────────────────────────

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (owner only)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) throw new AppError('Product not found', 404);

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to delete this product', 403);
  }

  // Delete images from Cloudinary
  for (const img of product.images) {
    if (img.publicId) {
      await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }
  }

  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted successfully' });
});

// ─── MARK AS SOLD ─────────────────────────────────────────────────────────────

// @desc    Mark product as sold
// @route   PUT /api/products/:id/sold
// @access  Private (owner only)
exports.markAsSold = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) throw new AppError('Product not found', 404);

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('Only the seller can mark this as sold', 403);
  }

  product.isSold = true;
  product.soldAt = new Date();
  await product.save();

  res.json({ success: true, product, message: 'Product marked as sold!' });
});

// ─── GET MY PRODUCTS ──────────────────────────────────────────────────────────

// @desc    Get current user's products
// @route   GET /api/products/my/listings
// @access  Private
exports.getMyProducts = asyncHandler(async (req, res) => {
  const { isSold } = req.query;

  const query = { seller: req.user._id };
  if (isSold !== undefined) query.isSold = isSold === 'true';

  const products = await Product.find(query).sort({ createdAt: -1 });

  res.json({ success: true, products });
});

// ─── GET RECOMMENDATIONS ──────────────────────────────────────────────────────

// @desc    Get recommended products based on category and activity
// @route   GET /api/products/recommendations
// @access  Public (better when logged in)
exports.getRecommendations = asyncHandler(async (req, res) => {
  const { productId, category, limit = 6 } = req.query;

  let preferredCategories = [category].filter(Boolean);

  // If user is logged in, use their view history
  if (req.user) {
    const user = await User.findById(req.user._id);
    const sorted = (user.viewedCategories || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((v) => v.category);
    preferredCategories = [...new Set([...preferredCategories, ...sorted])];
  }

  const query = {
    isSold: false,
    isFlagged: false,
  };

  // Exclude current product
  if (productId) {
    query._id = { $ne: productId };
  }

  // Prioritize preferred categories
  if (preferredCategories.length > 0) {
    query.category = { $in: preferredCategories };
  }

  let products = await Product.find(query)
    .populate('seller', 'name avatar averageRating isTrustedSeller')
    .sort({ views: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  // If not enough from preferred categories, fill with general products
  if (products.length < parseInt(limit)) {
    const remaining = parseInt(limit) - products.length;
    const existingIds = products.map((p) => p._id);
    const filler = await Product.find({
      isSold: false,
      isFlagged: false,
      _id: { $nin: [...existingIds, ...(productId ? [productId] : [])] },
    })
      .populate('seller', 'name avatar averageRating isTrustedSeller')
      .sort({ createdAt: -1 })
      .limit(remaining)
      .lean();
    products = [...products, ...filler];
  }

  res.json({ success: true, products });
});

// ─── GET SELLER'S PRODUCTS ────────────────────────────────────────────────────

// @desc    Get products by a specific seller
// @route   GET /api/products/seller/:sellerId
// @access  Public
exports.getSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    seller: req.params.sellerId,
    isSold: false,
    isFlagged: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, products });
});

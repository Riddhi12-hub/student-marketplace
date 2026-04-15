/**
 * Auth Controller
 * Handles user registration, login, logout, and profile updates
 */
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      college: user.college,
      location: user.location,
      phone: user.phone,
      bio: user.bio,
      averageRating: user.averageRating,
      totalRatings: user.totalRatings,
      isTrustedSeller: user.isTrustedSeller,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, college, location } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    college: college || '',
    location: location || '',
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user with password included
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, college, location, phone, bio } = req.body;

  const updateFields = {};
  if (name) updateFields.name = name;
  if (college !== undefined) updateFields.college = college;
  if (location !== undefined) updateFields.location = location;
  if (phone !== undefined) updateFields.phone = phone;
  if (bio !== undefined) updateFields.bio = bio;

  // If avatar was uploaded via multer/cloudinary
  if (req.file) {
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-url.com' 
      : `http://localhost:${process.env.PORT || 5000}`;
      
    updateFields.avatar = req.file.path.startsWith('uploads') || req.file.path.startsWith('uploads/') || req.file.path.startsWith('uploads\\')
      ? `${serverUrl}/${req.file.path.replace(/\\/g, '/')}`
      : req.file.path;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Get public user profile
// @route   GET /api/auth/user/:id
// @access  Public
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name avatar college location averageRating totalRatings isTrustedSeller createdAt bio'
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, user });
});

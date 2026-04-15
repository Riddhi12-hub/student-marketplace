/**
 * Auth Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const passport = require('passport');
const {
  register, login, getMe, updateProfile, changePassword, getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');
const { generateToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/user/:id', getUserProfile);

// ─── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google redirects back here with code
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed` }),
  (req, res) => {
    // Generate JWT for the authenticated Google user
    const token = generateToken(req.user._id);
    const user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      college: req.user.college,
      location: req.user.location,
      averageRating: req.user.averageRating,
      isTrustedSeller: req.user.isTrustedSeller,
    };
    // Send token + user to frontend via URL params (frontend reads and stores in localStorage)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

module.exports = router;


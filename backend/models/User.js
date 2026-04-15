/**
 * User Model
 * Handles user authentication and profile data
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: false, // Not required for OAuth users
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: '', // Will use generated avatar if empty
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    // Rating stats (denormalized for performance)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isTrustedSeller: {
      type: Boolean,
      default: false,
    },
    // Activity tracking for recommendations
    viewedCategories: [{
      category: String,
      count: { type: Number, default: 1 },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update trusted seller status based on rating
userSchema.methods.updateTrustedStatus = function () {
  this.isTrustedSeller = this.averageRating >= 4.0 && this.totalRatings >= 3;
};

// Virtual for profile completeness
userSchema.virtual('profileComplete').get(function () {
  return !!(this.college && this.location && this.phone);
});

module.exports = mongoose.model('User', userSchema);

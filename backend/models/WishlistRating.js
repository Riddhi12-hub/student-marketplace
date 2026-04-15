/**
 * Wishlist Model
 * Users can save products they're interested in
 */
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only wishlist a product once
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

/**
 * Rating Model
 * Seller rating system with comments
 */
const ratingSchema = new mongoose.Schema(
  {
    // The seller being rated
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The buyer giving the rating
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The product transaction this rating is for
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// A user can only rate a seller once per product
ratingSchema.index({ seller: 1, rater: 1, product: 1 }, { unique: true });
ratingSchema.index({ seller: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = { Wishlist, Rating };

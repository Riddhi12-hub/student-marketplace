/**
 * Product Model
 * Handles marketplace listings with fraud detection flags
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [1000000, 'Price seems unrealistic'],
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Books',
        'Electronics',
        'Gadgets',
        'Notes & Study Material',
        'Clothing',
        'Sports',
        'Furniture',
        'Stationery',
        'Lab Equipment',
        'Software',
        'Other',
      ],
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      default: 'Good',
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public_id for deletion
      },
    ],
    location: {
      type: String,
      trim: true,
      default: '',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSold: {
      type: Boolean,
      default: false,
    },
    soldAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    // Tags for better search
    tags: [{ type: String, trim: true, lowercase: true }],

    // ─── Fraud Detection Fields ──────────────────────────────────────
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReasons: [
      {
        type: String,
        enum: ['DUPLICATE_LISTING', 'UNREALISTIC_PRICE', 'SPAM_CONTENT', 'REPORTED_BY_USER'],
      },
    ],
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
  },
  {
    timestamps: true,
    // Enable text search index
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes for performance ──────────────────────────────────────────────────
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ location: 1 });
productSchema.index({ isSold: 1 });
productSchema.index({ createdAt: -1 });

// ─── Virtual: discount percentage ────────────────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);

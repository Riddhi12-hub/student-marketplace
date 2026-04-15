/**
 * ProductCard Component
 * Displays a product in grid/list view with actions
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Eye, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StarRating, TrustedBadge, ConditionBadge } from '../common/Spinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onWishlistChange, isWishlisted: initialWishlisted = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const {
    _id, title, price, originalPrice, category, condition,
    images, location, seller, isSold, views, isFlagged,
  } = product;

  const imageUrl = images?.[0]?.url || `https://placehold.co/400x300/e2e8f0/94a3b8?text=${encodeURIComponent(category)}`;
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to save items'); navigate('/login'); return; }

    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${_id}`);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${_id}`);
        setWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
      onWishlistChange?.(_id, !wishlisted);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link
      to={`/products/${_id}`}
      className="card group overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 block"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-100 h-44">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = `https://placehold.co/400x300/e2e8f0/94a3b8?text=${encodeURIComponent(category)}`; }}
        />

        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isSold && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 text-white text-[11px] font-bold rounded-lg">
              <CheckCircle2 size={10} /> SOLD
            </span>
          )}
          {discount > 0 && !isSold && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-lg">
              -{discount}%
            </span>
          )}
          {isFlagged && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 text-white text-[11px] font-semibold rounded-lg">
              <AlertTriangle size={10} /> Flagged
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center
            backdrop-blur-sm transition-all duration-200 shadow-sm
            ${wishlisted
              ? 'bg-red-500 text-white scale-100'
              : 'bg-white/80 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500'
            }`}
        >
          <Heart size={14} className={wishlisted ? 'fill-white' : ''} />
        </button>

        {/* Category pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="badge-primary text-[10px] backdrop-blur-sm">{category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        {/* Title */}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>

        {/* Condition + Location */}
        <div className="flex items-center justify-between mb-2">
          <ConditionBadge condition={condition} />
          {location && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400 truncate max-w-[100px]">
              <MapPin size={10} /> {location}
            </span>
          )}
        </div>

        {/* Seller info */}
        {seller && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <img
              src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=6366f1&color=fff&size=32`}
              alt={seller.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-[11px] text-slate-500 truncate">{seller.name}</span>
            {seller.isTrustedSeller && <TrustedBadge />}
            {seller.averageRating > 0 && (
              <div className="ml-auto">
                <StarRating rating={seller.averageRating} size="xs" />
              </div>
            )}
          </div>
        )}

        {/* Price + Views */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display font-bold text-lg text-primary-700">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {originalPrice > 0 && originalPrice > price && (
              <span className="text-xs text-slate-400 line-through ml-1.5">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="flex items-center gap-0.5 text-[11px]">
              <Eye size={11} /> {views || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

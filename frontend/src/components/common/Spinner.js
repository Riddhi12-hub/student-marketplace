/**
 * Common UI Components
 */
import React from 'react';
import { Star, ShoppingBag, Heart, Search, PackageX } from 'lucide-react';

// ─── Full screen / inline Spinner ─────────────────────────────────────────────
export const Spinner = ({ fullScreen = false, size = 'md' }) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizeMap[size]} border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin`} />
  );
  if (fullScreen) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        {spinner}
        <p className="text-sm text-slate-500 font-medium">Loading...</p>
      </div>
    </div>
  );
  return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default Spinner;

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => {
  const IconMap = {
    products: ShoppingBag,
    wishlist: Heart,
    search: Search,
    default: PackageX,
  };
  const Icon = (typeof icon === 'string' ? IconMap[icon] : icon) || IconMap.default;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="font-display font-bold text-slate-700 text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
export const StarRating = ({
  rating = 0,
  maxStars = 5,
  interactive = false,
  onChange,
  size = 'sm',
  showCount,
  totalRatings,
}) => {
  const [hovered, setHovered] = React.useState(0);
  const sizeMap = { xs: 12, sm: 14, md: 18, lg: 22 };
  const px = sizeMap[size] || 14;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = interactive ? (hovered || rating) > i : rating > i;
        const halfFilled = !interactive && rating > i && rating < i + 1;
        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(i + 1) : undefined}
            onMouseEnter={interactive ? () => setHovered(i + 1) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            style={{ lineHeight: 1 }}
          >
            <Star
              size={px}
              className={filled
                ? 'text-amber-400 fill-amber-400'
                : halfFilled
                  ? 'text-amber-400 fill-amber-200'
                  : 'text-slate-200 fill-slate-200'}
            />
          </button>
        );
      })}
      {showCount && (
        <span className="text-xs text-slate-500 ml-0.5">
          {rating.toFixed(1)} {totalRatings !== undefined && `(${totalRatings})`}
        </span>
      )}
    </div>
  );
};

// ─── Skeleton card for loading states ─────────────────────────────────────────
export const SkeletonCard = () => (
  <div className="card overflow-hidden animate-pulse">
    <div className="skeleton h-44 w-full" />
    <div className="p-4 space-y-2.5">
      <div className="skeleton h-4 w-3/4 rounded-full" />
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-2/3 rounded-full" />
      <div className="flex justify-between items-center pt-1">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>
    </div>
  </div>
);

// ─── Trusted seller badge ─────────────────────────────────────────────────────
export const TrustedBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 0L6.18 3.41H9.51L6.68 5.52 7.86 8.93 5 6.82 2.14 8.93 3.32 5.52 0.49 3.41H3.82L5 0Z" fill="#10b981"/>
    </svg>
    Trusted Seller
  </span>
);

// ─── Condition badge ──────────────────────────────────────────────────────────
export const ConditionBadge = ({ condition }) => {
  const map = {
    'New':       'bg-emerald-100 text-emerald-700',
    'Like New':  'bg-blue-100 text-blue-700',
    'Good':      'bg-amber-100 text-amber-700',
    'Fair':      'bg-orange-100 text-orange-700',
    'Poor':      'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[condition] || 'bg-slate-100 text-slate-600'}`}>
      {condition}
    </span>
  );
};

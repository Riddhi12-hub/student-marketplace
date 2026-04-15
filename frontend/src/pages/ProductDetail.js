/**
 * ProductDetail Page
 * Full product view with seller info, chat, wishlist, ratings, recommendations
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageSquare, MapPin, Eye, Share2, Flag,
  ChevronLeft, ChevronRight, CheckCircle2, Pencil, Trash2,
  ShieldCheck, AlertTriangle, Tag, Package
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import ChatWindow from '../components/chat/ChatWindow';
import { StarRating, TrustedBadge, ConditionBadge, Spinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [markSoldLoading, setMarkSoldLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);

        // Load recommendations, ratings in parallel
        const [recRes, ratingRes] = await Promise.allSettled([
          api.get(`/products/recommendations?productId=${id}&category=${res.data.product.category}`),
          api.get(`/ratings/seller/${res.data.product.seller._id}`),
        ]);
        if (recRes.status === 'fulfilled') setRecommendations(recRes.value.data.products);
        if (ratingRes.status === 'fulfilled') setRatings(ratingRes.value.data.ratings);

        // Check wishlist
        if (user) {
          try {
            const wRes = await api.get(`/wishlist/check/${id}`);
            setWishlisted(wRes.data.isWishlisted);
          } catch {}
        }
      } catch {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id, user]);

  const toggleWishlist = async () => {
    if (!user) { toast.error('Please login'); navigate('/login'); return; }
    setWishLoading(true);
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${id}`);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${id}`);
        setWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setWishLoading(false);
    }
  };

  const handleMarkSold = async () => {
    if (!window.confirm('Mark this item as sold?')) return;
    setMarkSoldLoading(true);
    try {
      await api.put(`/products/${id}/sold`);
      setProduct(p => ({ ...p, isSold: true }));
      toast.success('Marked as sold!');
    } catch { toast.error('Failed'); }
    finally { setMarkSoldLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Listing deleted');
      navigate('/dashboard');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Login to rate'); return; }
    if (!userRating) { toast.error('Please select a rating'); return; }
    setRatingSubmitting(true);
    try {
      await api.post('/ratings', {
        sellerId: product.seller._id,
        productId: id,
        rating: userRating,
        comment: ratingComment,
      });
      toast.success('Rating submitted!');
      const ratingRes = await api.get(`/ratings/seller/${product.seller._id}`);
      setRatings(ratingRes.data.ratings);
      setUserRating(0);
      setRatingComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const isOwner = user && product && user._id === (product.seller._id || product.seller);
  const images = product?.images?.length > 0
    ? product.images
    : [{ url: `https://placehold.co/600x400/e2e8f0/94a3b8?text=${encodeURIComponent(product?.category || 'Product')}` }];

  if (loading) return <Spinner fullScreen />;
  if (!product) return null;

  const discount = product.originalPrice > 0 && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-primary-600">{product.category}</Link>
          <span>/</span>
          <span className="text-slate-700 truncate max-w-xs">{product.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* ── Left: Images + Details ── */}
          <div className="space-y-6">
            {/* Image gallery */}
            <div className="card overflow-hidden">
              <div className="relative bg-slate-100 h-80 sm:h-96">
                <img
                  src={images[imgIdx]?.url}
                  alt={product.title}
                  className="w-full h-full object-contain"
                  onError={(e) => e.target.src = `https://placehold.co/600x400/e2e8f0/94a3b8?text=${encodeURIComponent(product.category)}`}
                />
                {product.isSold && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                      <span className="font-display font-bold text-lg text-slate-800">SOLD</span>
                    </div>
                  </div>
                )}
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
                {/* Fraud flag */}
                {product.isFlagged && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-xl">
                    <AlertTriangle size={13} /> Flagged for review
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-primary-500' : 'border-transparent'}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge-primary">{product.category}</span>
                    <ConditionBadge condition={product.condition} />
                    {product.isSold && <span className="badge bg-slate-200 text-slate-600">SOLD</span>}
                  </div>
                  <h1 className="text-2xl font-display font-bold text-slate-900 leading-snug">{product.title}</h1>
                </div>
                <button onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
                  className="btn-ghost p-2.5 shrink-0">
                  <Share2 size={18} />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl font-display font-bold text-primary-700">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice > 0 && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-slate-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                    <span className="badge-success">{discount}% off</span>
                  </>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                {product.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    {product.location}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Eye size={15} className="text-slate-400 shrink-0" />
                  {product.views} views
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Package size={15} className="text-slate-400 shrink-0" />
                  {product.condition}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  Listed {format(new Date(product.createdAt), 'dd MMM yyyy')}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <h3 className="font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      <Tag size={11} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings section */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-slate-800 mb-5">Seller Reviews</h3>

              {ratings.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {ratings.slice(0, 5).map(r => (
                    <div key={r._id} className="flex gap-3">
                      <img
                        src={r.rater?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.rater?.name || 'U')}&background=6366f1&color=fff&size=40`}
                        alt={r.rater?.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-slate-800">{r.rater?.name}</span>
                          <StarRating rating={r.rating} size="xs" />
                        </div>
                        {r.comment && <p className="text-xs text-slate-500 mt-0.5">{r.comment}</p>}
                        <p className="text-[11px] text-slate-300 mt-0.5">{format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rate seller form */}
              {user && !isOwner && product.isSold && (
                <form onSubmit={handleRatingSubmit} className="border-t border-slate-100 pt-5">
                  <h4 className="font-semibold text-sm text-slate-700 mb-3">Rate this seller</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={userRating} interactive onChange={setUserRating} size="lg" />
                    {userRating > 0 && <span className="text-sm text-slate-500">{['','Poor','Fair','Good','Very Good','Excellent'][userRating]}</span>}
                  </div>
                  <textarea
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    placeholder="Share your experience (optional)"
                    className="input text-sm resize-none mb-3"
                    rows={2}
                  />
                  <button type="submit" disabled={ratingSubmitting || !userRating} className="btn-primary text-sm py-2 disabled:opacity-50">
                    {ratingSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── Right: Seller Card + Actions ── */}
          <div className="space-y-4">
            {/* Seller card */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-4">Sold by</h3>
              <Link to={`/seller/${product.seller._id}`} className="flex items-center gap-3 mb-4 group">
                <img
                  src={product.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller.name)}&background=6366f1&color=fff&size=80`}
                  alt={product.seller.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-100 group-hover:ring-primary-400 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">{product.seller.name}</p>
                  {product.seller.college && <p className="text-xs text-slate-400 truncate">{product.seller.college}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {product.seller.isTrustedSeller && <TrustedBadge />}
                    {product.seller.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={product.seller.averageRating} size="xs" showCount totalRatings={product.seller.totalRatings} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Actions */}
              {isOwner ? (
                <div className="space-y-2">
                  <div className="p-3 bg-primary-50 rounded-xl text-sm text-primary-700 font-medium text-center">
                    This is your listing
                  </div>
                  {!product.isSold && (
                    <>
                      <Link to={`/edit-product/${id}`} className="btn-secondary w-full justify-center text-sm py-2.5">
                        <Pencil size={15} /> Edit Listing
                      </Link>
                      <button onClick={handleMarkSold} disabled={markSoldLoading}
                        className="btn-primary w-full justify-center text-sm py-2.5 disabled:opacity-60">
                        <CheckCircle2 size={15} /> Mark as Sold
                      </button>
                    </>
                  )}
                  <button onClick={handleDelete} disabled={deleteLoading}
                    className="btn-danger w-full justify-center text-sm py-2.5 disabled:opacity-60">
                    <Trash2 size={15} /> Delete Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {!product.isSold ? (
                    <button onClick={() => { if (!user) { toast.error('Please login to chat'); navigate('/login'); return; } setChatOpen(true); }}
                      className="btn-primary w-full justify-center py-3">
                      <MessageSquare size={16} /> Chat with Seller
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-100 rounded-xl text-center text-sm text-slate-500 font-medium">
                      <CheckCircle2 size={16} className="inline mr-1.5 text-emerald-500" />
                      This item has been sold
                    </div>
                  )}
                  <button onClick={toggleWishlist} disabled={wishLoading}
                    className={`w-full justify-center py-2.5 btn-secondary text-sm transition-all ${wishlisted ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}`}>
                    <Heart size={15} className={wishlisted ? 'fill-red-500 text-red-500' : ''} />
                    {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
                  </button>
                  <Link to={`/seller/${product.seller._id}`} className="btn-ghost w-full justify-center py-2.5 text-sm">
                    View Seller Profile
                  </Link>
                </div>
              )}
            </div>

            {/* Safety tips */}
            <div className="card p-4 bg-emerald-50 border-emerald-100">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 text-sm mb-1">Safety Tips</p>
                  <ul className="text-xs text-emerald-700 space-y-0.5">
                    <li>• Meet in public places for transactions</li>
                    <li>• Verify items before making payment</li>
                    <li>• Use UPI for secure payments</li>
                    <li>• Don't share personal bank details</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Report button */}
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-red-500 transition-colors">
              <Flag size={12} /> Report this listing
            </button>
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Chat window popup */}
      {chatOpen && (
        <ChatWindow
          product={product}
          seller={product.seller}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;

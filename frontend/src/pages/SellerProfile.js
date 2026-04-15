/**
 * SellerProfile Page - Public seller profile with listings and ratings
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, GraduationCap, Star, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { StarRating, TrustedBadge, Spinner, EmptyState } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const SellerProfile = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, prodRes, ratingRes] = await Promise.allSettled([
          api.get(`/auth/user/${id}`),
          api.get(`/products/seller/${id}`),
          api.get(`/ratings/seller/${id}`),
        ]);
        if (userRes.status === 'fulfilled') setSeller(userRes.value.data.user);
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data.products);
        if (ratingRes.status === 'fulfilled') setRatings(ratingRes.value.data.ratings);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Spinner fullScreen />;
  if (!seller) return <div className="text-center py-20 text-slate-400">Seller not found</div>;

  const avatar = seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=6366f1&color=fff&size=200`;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="page-container">
        {/* Seller header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img src={avatar} alt={seller.name} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary-100 shadow-soft" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-display font-bold text-slate-900">{seller.name}</h1>
                {seller.isTrustedSeller && <TrustedBadge />}
              </div>
              {seller.bio && <p className="text-slate-500 text-sm mt-1 max-w-lg">{seller.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                {seller.college && (
                  <span className="flex items-center gap-1.5"><GraduationCap size={14} />{seller.college}</span>
                )}
                {seller.location && (
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{seller.location}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />Member since {format(new Date(seller.createdAt), 'MMM yyyy')}
                </span>
              </div>
              {seller.averageRating > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={seller.averageRating} size="md" />
                  <span className="font-semibold text-slate-700">{seller.averageRating.toFixed(1)}</span>
                  <span className="text-slate-400 text-sm">({seller.totalRatings} reviews)</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 text-center">
              <div className="text-2xl font-display font-bold text-primary-700">{products.length}</div>
              <div className="text-xs text-slate-400">Active Listings</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Products */}
          <div>
            <h2 className="section-title mb-5 flex items-center gap-2">
              <Package size={20} className="text-primary-600" /> Listings
            </h2>
            {products.length === 0 ? (
              <EmptyState icon="products" title="No active listings" description="This seller has no items listed right now." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="section-title mb-5 flex items-center gap-2">
              <Star size={20} className="text-amber-400 fill-amber-400" /> Reviews
            </h2>
            {ratings.length === 0 ? (
              <div className="card p-6 text-center text-slate-400 text-sm">No reviews yet</div>
            ) : (
              <div className="space-y-4">
                {ratings.slice(0, 10).map(r => (
                  <div key={r._id} className="card p-4 flex items-start gap-3">
                    <img
                      src={r.rater?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.rater?.name||'U')}&background=6366f1&color=fff&size=40`}
                      alt="" className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-slate-800">{r.rater?.name}</span>
                        <StarRating rating={r.rating} size="xs" />
                      </div>
                      {r.product?.title && (
                        <p className="text-[11px] text-slate-400">For: {r.product.title}</p>
                      )}
                      {r.comment && <p className="text-xs text-slate-600 mt-1">{r.comment}</p>}
                      <p className="text-[11px] text-slate-300 mt-1">{format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;

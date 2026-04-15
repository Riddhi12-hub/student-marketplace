/**
 * Wishlist Page
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { Spinner, EmptyState, SkeletonCard } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wishlist')
      .then(res => setWishlist(res.data.wishlist))
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false));
  }, []);

  const handleWishlistChange = (productId, isNowWishlisted) => {
    if (!isNowWishlisted) {
      setWishlist(prev => prev.filter(item => item.product?._id !== productId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="page-container">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Heart size={20} className="text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">My Wishlist</h1>
            <p className="text-slate-500 text-sm">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState icon="wishlist" title="Your wishlist is empty"
            description="Save items you're interested in and find them here later."
            action={<Link to="/products" className="btn-primary">Browse Products</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map(item => item.product && (
              <ProductCard
                key={item._id}
                product={item.product}
                isWishlisted={true}
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { Wishlist };
export default Wishlist;

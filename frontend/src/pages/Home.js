/**
 * Home Page
 * Landing page with hero, categories, and featured products
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, Shield, Zap, BookOpen,
  Laptop, FileText, Shirt, Dumbbell, FlaskConical,
  Search, ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { SkeletonCard } from '../components/common/Spinner';

const CATEGORIES = [
  { name: 'Books',               icon: BookOpen,    color: 'bg-blue-50 text-blue-600',    count: '2.4k' },
  { name: 'Electronics',         icon: Laptop,      color: 'bg-purple-50 text-purple-600', count: '1.8k' },
  { name: 'Notes & Study Material', icon: FileText, color: 'bg-emerald-50 text-emerald-600', count: '3.1k' },
  { name: 'Gadgets',             icon: Zap,         color: 'bg-amber-50 text-amber-600',  count: '945' },
  { name: 'Clothing',            icon: Shirt,       color: 'bg-pink-50 text-pink-600',    count: '1.2k' },
  { name: 'Sports',              icon: Dumbbell,    color: 'bg-orange-50 text-orange-600', count: '620' },
  { name: 'Lab Equipment',       icon: FlaskConical,color: 'bg-teal-50 text-teal-600',    count: '430' },
];

const STATS = [
  { label: 'Active Listings', value: '12,000+' },
  { label: 'Happy Students', value: '8,500+' },
  { label: 'Colleges Connected', value: '120+' },
  { label: 'Items Sold', value: '45,000+' },
];

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=8&sort=-createdAt')
      .then(res => setFeatured(res.data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
        </div>

        <div className="page-container relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <TrendingUp size={14} />
              The #1 Student Marketplace in India
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Buy & Sell Campus<br />
              <span className="text-accent-400">Essentials</span> Easily
            </h1>

            <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Books, gadgets, notes and more — find great deals from students at your college.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for books, gadgets..."
                  className="w-full pl-12 pr-4 py-4 text-slate-800 bg-white rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                />
              </div>
              <button type="submit"
                className="px-6 py-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-2xl transition-colors shadow-lg whitespace-nowrap">
                Search
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 text-sm text-primary-200">
              {['Books', 'Electronics', 'Notes', 'Gadgets'].map(c => (
                <button key={c} onClick={() => navigate(`/products?category=${c}`)}
                  className="hover:text-white transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-display font-bold text-2xl text-primary-700">{value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="page-container py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Browse Categories</h2>
          <Link to="/products" className="text-sm text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {CATEGORIES.map(({ name, icon: Icon, color, count }) => (
            <Link
              key={name}
              to={`/products?category=${encodeURIComponent(name)}`}
              className="group card p-4 text-center hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-tight">{name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="page-container pb-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Latest Listings</h2>
          <Link to="/products" className="btn-secondary text-sm py-2">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : featured.map(p => <ProductCard key={p._id} product={p} />)
          }
        </div>
      </section>

      {/* ── Sell CTA ── */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="page-container py-16 text-center">
          <Shield size={32} className="mx-auto mb-4 text-primary-200" />
          <h2 className="text-3xl font-display font-bold mb-3">Ready to Start Selling?</h2>
          <p className="text-primary-100 mb-6 max-w-md mx-auto">
            List your unused books, gadgets and more in under 2 minutes. Reach thousands of students instantly.
          </p>
          <Link to="/create-product" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-primary-50 transition-colors shadow-lg">
            List an Item <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

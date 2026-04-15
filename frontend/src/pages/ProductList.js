/**
 * ProductList Page
 * Browse all products with search, filters, and pagination
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp,
  Search, Grid3X3, List, ArrowUpDown
} from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { SkeletonCard, EmptyState } from '../components/common/Spinner';

const CATEGORIES = ['All','Books','Electronics','Gadgets','Notes & Study Material','Clothing','Sports','Furniture','Stationery','Lab Equipment','Software','Other'];
const CONDITIONS = ['New','Like New','Good','Fair','Poor'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt',  label: 'Oldest First' },
  { value: 'price',      label: 'Price: Low to High' },
  { value: '-price',     label: 'Price: High to Low' },
  { value: '-views',     label: 'Most Popular' },
];

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Filter state - read from URL
  const [filters, setFilters] = useState({
    search:    searchParams.get('search')   || '',
    category:  searchParams.get('category') || 'All',
    condition: searchParams.get('condition')|| '',
    minPrice:  searchParams.get('minPrice') || '',
    maxPrice:  searchParams.get('maxPrice') || '',
    location:  searchParams.get('location') || '',
    sort:      searchParams.get('sort')     || '-createdAt',
    page:      parseInt(searchParams.get('page') || '1'),
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)    params.set('search',    filters.search);
      if (filters.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters.condition) params.set('condition', filters.condition);
      if (filters.minPrice)  params.set('minPrice',  filters.minPrice);
      if (filters.maxPrice)  params.set('maxPrice',  filters.maxPrice);
      if (filters.location)  params.set('location',  filters.location);
      params.set('sort',  filters.sort);
      params.set('page',  filters.page);
      params.set('limit', '12');

      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Sync filters to URL
  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'All') p.set(k, v); });
    setSearchParams(p, { replace: true });
  }, [filters, setSearchParams]);

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  const clearFilters = () => setFilters({
    search: '', category: 'All', condition: '', minPrice: '',
    maxPrice: '', location: '', sort: '-createdAt', page: 1,
  });

  const activeFilterCount = [
    filters.category !== 'All',
    filters.condition,
    filters.minPrice,
    filters.maxPrice,
    filters.location,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="page-container py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                placeholder="Search products..."
                className="input pl-9 py-2.5 text-sm"
              />
            </div>

            {/* Category quick filters */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Books', 'Electronics', 'Gadgets', 'Notes & Study Material'].map(cat => (
                <button key={cat}
                  onClick={() => setFilter('category', cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filters.category === cat
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={e => setFilter('sort', e.target.value)}
                className="input py-2.5 pr-8 text-sm appearance-none cursor-pointer min-w-[160px]"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter toggle */}
            <button onClick={() => setFiltersOpen(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                filtersOpen || activeFilterCount > 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'
              }`}>
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${filtersOpen ? 'bg-white/20' : 'bg-primary-600 text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* View mode */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}>
                <Grid3X3 size={15} />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}>
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
              {/* Category (mobile) */}
              <div className="lg:hidden">
                <label className="label">Category</label>
                <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="label">Condition</label>
                <select value={filters.condition} onChange={e => setFilter('condition', e.target.value)} className="input py-2 text-sm">
                  <option value="">Any</option>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Min price */}
              <div>
                <label className="label">Min Price (₹)</label>
                <input type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)}
                  placeholder="0" className="input py-2 text-sm" min="0" />
              </div>

              {/* Max price */}
              <div>
                <label className="label">Max Price (₹)</label>
                <input type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)}
                  placeholder="No limit" className="input py-2 text-sm" min="0" />
              </div>

              {/* Location */}
              <div>
                <label className="label">Location</label>
                <input type="text" value={filters.location} onChange={e => setFilter('location', e.target.value)}
                  placeholder="e.g. Delhi" className="input py-2 text-sm" />
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <div className="flex items-end">
                  <button onClick={clearFilters}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium w-full justify-center">
                    <X size={14} /> Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="page-container py-6">
        {/* Results count */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {pagination.total > 0
                ? <><span className="font-semibold text-slate-800">{pagination.total.toLocaleString()}</span> products found</>
                : 'No products found'}
              {filters.search && <span className="ml-1">for "<em>{filters.search}</em>"</span>}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="search"
            title="No products found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <div className="flex gap-3">
                <button onClick={clearFilters} className="btn-secondary text-sm py-2">Clear filters</button>
                <Link to="/create-product" className="btn-primary text-sm py-2">Sell something</Link>
              </div>
            }
          />
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilter('page', filters.page - 1)}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = filters.page <= 3
                  ? i + 1
                  : filters.page >= pagination.pages - 2
                    ? pagination.pages - 4 + i
                    : filters.page - 2 + i;
                if (pageNum < 1 || pageNum > pagination.pages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setFilter('page', pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      filters.page === pageNum
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-primary-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={!pagination.hasMore}
              onClick={() => setFilter('page', filters.page + 1)}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;

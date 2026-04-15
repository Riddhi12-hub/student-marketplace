import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
        <BookOpen size={40} className="text-primary-500" />
      </div>
      <h1 className="text-7xl font-display font-bold text-slate-200 mb-2">404</h1>
      <h2 className="text-2xl font-display font-bold text-slate-800 mb-3">Page not found</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <Link to="/products" className="btn-secondary">Browse Products</Link>
      </div>
    </div>
  </div>
);

export default NotFound;

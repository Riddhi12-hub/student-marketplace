/**
 * CreateProduct Page
 * Form to list a new item with multi-image upload
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, Plus, AlertTriangle, CheckCircle2,
  ImagePlus, Tag, DollarSign, MapPin, Info
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Books','Electronics','Gadgets','Notes & Study Material','Clothing','Sports','Furniture','Stationery','Lab Equipment','Software','Other'];
const CONDITIONS = ['New','Like New','Good','Fair','Poor'];

const CreateProduct = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', price: '', originalPrice: '',
    category: 'Books', condition: 'Good', location: '', tags: '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fraudWarnings, setFraudWarnings] = useState([]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 3) e.title = 'Title must be at least 3 characters';
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = 'Enter a valid price';
    if (!form.category) e.category = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      images.forEach(img => fd.append('images', img));

      const res = await api.post('/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.fraudWarnings?.length > 0) {
        setFraudWarnings(res.data.fraudWarnings);
        toast('⚠️ Listing created but flagged for review', { icon: '⚠️' });
      } else {
        toast.success('Listing created successfully!');
      }
      navigate(`/products/${res.data.product._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="page-container max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900">List an Item</h1>
          <p className="text-slate-500 mt-1.5">Fill in the details to create your listing</p>
        </div>

        {fraudWarnings.length > 0 && (
          <div className="card p-4 bg-amber-50 border-amber-200 mb-6">
            <div className="flex gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Listing flagged for review</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                  {fraudWarnings.map(w => (
                    <li key={w}>• {w === 'DUPLICATE_LISTING' ? 'Similar listing already exists' : 'Price appears unrealistic for this category'}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ImagePlus size={18} className="text-primary-600" /> Photos
            </h2>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer
                hover:border-primary-400 hover:bg-primary-50 transition-all group mb-4"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload size={22} className="text-primary-600" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">Click to upload photos</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP up to 5MB · Max 5 photos</p>
              <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex">
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-md font-medium">Cover</span>
                    )}
                  </div>
                ))}
                {previews.length < 5 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-400 flex items-center justify-center text-slate-400 hover:text-primary-500 transition-all">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Basic info */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-slate-800 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input name="title" value={form.title} onChange={handleChange}
                  placeholder="e.g. NCERT Physics Class 12 (2023 edition)"
                  className={`input ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe the condition, what's included, reason for selling..."
                  rows={4}
                  className={`input resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : ''}`} />
                <div className="flex justify-between mt-1">
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                  <p className="text-xs text-slate-400 ml-auto">{form.description.length}/2000</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} className="input">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Condition *</label>
                  <select name="condition" value={form.condition} onChange={handleChange} className="input">
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-primary-600" /> Pricing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Selling Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                  <input name="price" type="number" value={form.price} onChange={handleChange}
                    placeholder="500" min="0" className={`input pl-8 ${errors.price ? 'border-red-400' : ''}`} />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="label">Original Price (₹) <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                  <input name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange}
                    placeholder="1200" min="0" className="input pl-8" />
                </div>
              </div>
            </div>
            {form.originalPrice > 0 && form.price > 0 && Number(form.originalPrice) > Number(form.price) && (
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 size={15} />
                {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% discount will be shown
              </div>
            )}
          </div>

          {/* Location & Tags */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-slate-800 mb-4">Location & Tags</h2>
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" /> Location
                </label>
                <input name="location" value={form.location} onChange={handleChange}
                  placeholder="e.g. South Delhi, Connaught Place" className="input" />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <Tag size={14} className="text-slate-400" /> Tags
                  <span className="text-xs text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input name="tags" value={form.tags} onChange={handleChange}
                  placeholder="e.g. python, programming, beginners" className="input" />
              </div>
            </div>
          </div>

          {/* Fraud detection info */}
          <div className="flex items-start gap-2.5 p-4 bg-blue-50 rounded-xl text-sm text-blue-700 border border-blue-100">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>Our system automatically checks for duplicate listings and unrealistic pricing to keep the marketplace trustworthy.</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 justify-center py-3.5">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-[2] justify-center py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="animate-pulse">Creating listing...</span> : '🚀 Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;

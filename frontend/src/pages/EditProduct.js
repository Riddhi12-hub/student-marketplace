/**
 * EditProduct Page
 * Pre-filled form for editing an existing listing
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const CATEGORIES = ['Books','Electronics','Gadgets','Notes & Study Material','Clothing','Sports','Furniture','Stationery','Lab Equipment','Software','Other'];
const CONDITIONS = ['New','Like New','Good','Fair','Poor'];

const EditProduct = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: '', description: '', price: '', originalPrice: '',
    category: 'Books', condition: 'Good', location: '', tags: '',
  });
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data.product;

        // Auth check
        if (p.seller._id !== user._id && p.seller !== user._id) {
          toast.error('Not authorized');
          navigate('/dashboard');
          return;
        }

        setForm({
          title: p.title,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice || '',
          category: p.category,
          condition: p.condition,
          location: p.location || '',
          tags: p.tags?.join(', ') || '',
        });
      } catch {
        toast.error('Product not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 3) e.title = 'Title must be at least 3 characters';
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = 'Enter a valid price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      newImages.forEach(img => fd.append('images', img));

      await api.put(`/products/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Listing updated!');
      navigate(`/products/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="page-container max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Edit Listing</h1>
        <p className="text-slate-500 mb-8">Update your product information below</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Title *</label>
              <input name="title" value={form.title} onChange={handleChange}
                className={`input ${errors.title ? 'border-red-400' : ''}`} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={4} className={`input resize-none ${errors.description ? 'border-red-400' : ''}`} />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="input">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange} className="input">
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Selling Price (₹) *</label>
                <input name="price" type="number" value={form.price} onChange={handleChange}
                  className={`input ${errors.price ? 'border-red-400' : ''}`} min="0" />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="label">Original Price (₹)</label>
                <input name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange}
                  className="input" min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} className="input" />
              </div>
            </div>

            {/* New images */}
            <div>
              <label className="label">Replace Images (optional)</label>
              <input type="file" multiple accept="image/*"
                onChange={e => {
                  const files = Array.from(e.target.files).slice(0, 5);
                  setNewImages(files);
                  setNewPreviews(files.map(f => URL.createObjectURL(f)));
                }}
                className="input py-2 text-sm" />
              {newPreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {newPreviews.map((src, i) => (
                    <img key={i} src={src} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ))}
                </div>
              )}
              {newImages.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg">
                  <AlertCircle size={13} /> This will replace all existing images
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(`/products/${id}`)} className="btn-secondary flex-1 justify-center py-3.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-[2] justify-center py-3.5 disabled:opacity-60">
              {saving ? 'Saving...' : '✅ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;

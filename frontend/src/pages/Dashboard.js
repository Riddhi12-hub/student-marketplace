/**
 * Dashboard Page
 * User's personal dashboard - stats, listings, conversations
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, CheckCircle2, Heart, Star, MessageSquare,
  Plus, Pencil, Trash2, Tag, TrendingUp, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StarRating, Spinner, EmptyState, SkeletonCard } from '../components/common/Spinner';
import ChatWindow from '../components/chat/ChatWindow';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [tab, setTab] = useState('listings');
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.conversations);
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, listRes, soldRes] = await Promise.allSettled([
          api.get('/users/dashboard'),
          api.get('/products/my/listings?isSold=false'),
          api.get('/products/my/listings?isSold=true'),
        ]);

        if (dashRes.status === 'fulfilled') {
          setStats(dashRes.value.data.stats);
          setRecentRatings(dashRes.value.data.recentRatings || []);
        }
        if (listRes.status === 'fulfilled') setListings(listRes.value.data.products);
        if (soldRes.status === 'fulfilled') setSoldItems(soldRes.value.data.products);
        await loadConversations();
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Refresh conversations when a real-time notification arrives
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      loadConversations();
    }
  }, [notifications]);

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${productId}`);
      setListings(prev => prev.filter(p => p._id !== productId));
      toast.success('Listing deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleMarkSold = async (productId) => {
    try {
      await api.put(`/products/${productId}/sold`);
      const product = listings.find(p => p._id === productId);
      setListings(prev => prev.filter(p => p._id !== productId));
      setSoldItems(prev => [...prev, { ...product, isSold: true }]);
      toast.success('Marked as sold!');
    } catch { toast.error('Failed'); }
  };

  const getAvatar = (u) => u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name||'U')}&background=6366f1&color=fff&size=64`;

  if (loading) return <Spinner fullScreen />;

  const TABS = [
    { id: 'listings', label: 'Active Listings', count: listings.length },
    { id: 'sold', label: 'Sold Items', count: soldItems.length },
    { id: 'chats', label: 'Messages', count: conversations.length },
    { id: 'reviews', label: 'Reviews', count: recentRatings.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={getAvatar(user)} alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover ring-4 ring-primary-100 shadow-soft" />
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-500 text-sm">{user.college || user.email}</p>
              {user.isTrustedSeller && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">Trusted Seller</span>
                </div>
              )}
            </div>
          </div>
          <Link to="/create-product" className="btn-primary">
            <Plus size={16} /> New Listing
          </Link>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Package}       label="Active"      value={stats.activeListings}  color="bg-blue-100 text-blue-600" />
            <StatCard icon={CheckCircle2}  label="Sold"        value={stats.soldItems}        color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={Heart}         label="Wishlisted"  value={stats.wishlistCount}    color="bg-red-100 text-red-500" />
            <StatCard icon={Star}          label="Avg. Rating" value={stats.averageRating || '—'} color="bg-amber-100 text-amber-600" />
            <StatCard icon={MessageSquare} label="Chats"       value={stats.conversations}    color="bg-purple-100 text-purple-600" />
            <StatCard icon={TrendingUp}    label="Reviews"     value={stats.totalRatings}     color="bg-pink-100 text-pink-600" />
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-white shadow-card text-primary-700' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  tab === t.id ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Active Listings ── */}
        {tab === 'listings' && (
          listings.length === 0 ? (
            <EmptyState icon="products" title="No active listings"
              description="You haven't listed anything yet. Start selling today!"
              action={<Link to="/create-product" className="btn-primary">+ Create Listing</Link>}
            />
          ) : (
            <div className="space-y-3">
              {listings.map(p => (
                <div key={p._id} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                  <Link to={`/products/${p._id}`}>
                    <img
                      src={p.images?.[0]?.url || `https://placehold.co/80x80/e2e8f0/94a3b8?text=${encodeURIComponent(p.category)}`}
                      alt={p.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${p._id}`} className="font-semibold text-slate-800 hover:text-primary-700 transition-colors line-clamp-1">
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-bold text-primary-700 text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className="badge-gray">{p.category}</span>
                      <span className="flex items-center gap-1"><Tag size={11}/>{p.condition}</span>
                      <span>{p.views} views</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Listed {format(new Date(p.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/edit-product/${p._id}`} className="btn-secondary py-1.5 px-3 text-xs">
                      <Pencil size={13} /> Edit
                    </Link>
                    <button onClick={() => handleMarkSold(p._id)}
                      className="btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 size={13} /> Sold
                    </button>
                    <button onClick={() => handleDelete(p._id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Sold Items ── */}
        {tab === 'sold' && (
          soldItems.length === 0 ? (
            <EmptyState icon="products" title="No sold items yet" description="Items you mark as sold will appear here." />
          ) : (
            <div className="space-y-3">
              {soldItems.map(p => (
                <div key={p._id} className="card p-4 flex items-center gap-4 opacity-75">
                  <img src={p.images?.[0]?.url || `https://placehold.co/80x80/e2e8f0/94a3b8?text=Sold`}
                    alt={p.title} className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 grayscale" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-600 line-clamp-1">{p.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="font-bold text-slate-500">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className="badge bg-slate-200 text-slate-500">SOLD</span>
                      {p.soldAt && <span>Sold {format(new Date(p.soldAt), 'dd MMM yyyy')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Conversations ── */}
        {tab === 'chats' && (
          conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations" description="Chats with buyers and sellers appear here." />
          ) : (
            <div className="space-y-3">
              {conversations.map(conv => {
                const other = conv.participants?.find(p => p._id !== user._id);
                return (
                  <div key={conv._id}
                    onClick={() => setActiveChat(conv)}
                    className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-shadow">
                    <img src={getAvatar(other)} alt={other?.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{other?.name || 'User'}</p>
                        {conv.myUnread > 0 && (
                          <span className="w-5 h-5 bg-primary-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                            {conv.myUnread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        Re: {conv.product?.title || 'Deleted product'}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Reviews ── */}
        {tab === 'reviews' && (
          recentRatings.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" description="Ratings from buyers will appear here." />
          ) : (
            <div className="space-y-4">
              {recentRatings.map(r => (
                <div key={r._id} className="card p-5 flex items-start gap-3">
                  <img src={getAvatar(r.rater)} alt={r.rater?.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800 text-sm">{r.rater?.name}</p>
                      <StarRating rating={r.rating} size="xs" />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">For: {r.product?.title}</p>
                    {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                    <p className="text-xs text-slate-300 mt-1">{format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Active chat window */}
      {activeChat && (
        <ChatWindow
          conversation={activeChat}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

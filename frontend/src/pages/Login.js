import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Eye, EyeOff, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BACKEND = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show error from OAuth redirect
  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      setError('Google sign-in failed. Please try again.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (email) => {
    setForm({ email, password: 'password123' });
    setLoading(true);
    try {
      await login(email, 'password123');
      toast.success('Logged in with demo account!');
      navigate('/');
    } catch { setError('Demo login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <BookOpen size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Log in to your UniMarket account</p>
        </div>

        <div className="card p-7 shadow-soft">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 text-red-700 rounded-xl mb-5 text-sm border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="you@college.edu" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  placeholder="••••••••" className="input pr-12" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="animate-pulse">Signing in...</span> : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          {/* ── Google OAuth Button ── */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <a
              href={`${BACKEND}/api/auth/google`}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl transition-all font-semibold text-slate-700 text-sm shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </a>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Quick demo login</p>
            <div className="grid grid-cols-2 gap-2">
              {['arjun@test.com', 'priya@test.com'].map(email => (
                <button key={email} onClick={() => demoLogin(email)}
                  className="px-3 py-2 text-xs bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 rounded-lg transition-colors font-medium truncate">
                  {email.split('@')[0]}@...
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          New to UniMarket?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">Create account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

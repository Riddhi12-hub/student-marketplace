/**
 * App.js - Root component with routing
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './styles/index.css';

// Layouts
import Navbar from './components/common/Navbar';
import Spinner from './components/common/Spinner';

// Pages (lazy loaded for performance)
const Home           = lazy(() => import('./pages/Home'));
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const ProductList    = lazy(() => import('./pages/ProductList'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const CreateProduct  = lazy(() => import('./pages/CreateProduct'));
const EditProduct    = lazy(() => import('./pages/EditProduct'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Wishlist       = lazy(() => import('./pages/Wishlist'));
const Profile        = lazy(() => import('./pages/Profile'));
const SellerProfile  = lazy(() => import('./pages/SellerProfile'));
const OAuthCallback  = lazy(() => import('./pages/OAuthCallback'));
const NotFound       = lazy(() => import('./pages/NotFound'));

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Public route - redirect to home if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Suspense fallback={<Spinner fullScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/seller/:id" element={<SellerProfile />} />

        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        <Route path="/create-product" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
        <Route path="/edit-product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/wishlist"  element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

const App = () => (
  <Router>
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  </Router>
);

export default App;

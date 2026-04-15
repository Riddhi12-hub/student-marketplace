/**
 * OAuthCallback.js
 * Handles the redirect from Google OAuth — reads token from URL, logs user in
 */
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        updateUser(user);
        toast.success(`Welcome, ${user.name}! 🎉`);
        navigate('/');
      } catch {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, updateUser]);

  return <Spinner fullScreen />;
};

export default OAuthCallback;

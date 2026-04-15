/**
 * Profile Page - Edit user profile
 */
import React, { useState } from 'react';
import { Camera, Save, User } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name:     user?.name     || '',
    college:  user?.college  || '',
    location: user?.location || '',
    phone:    user?.phone    || '',
    bio:      user?.bio      || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append('avatar', avatarFile);
      const res = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwords don't match"); return; }
    if (pwForm.newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const avatar = avatarPreview || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=6366f1&color=fff&size=200`;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="page-container max-w-2xl">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">Edit Profile</h1>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
          <div className="card p-6 flex items-center gap-6">
            <div className="relative">
              <img src={avatar} alt={user?.name} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary-100" />
              <label htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
                <Camera size={14} />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">Click the camera icon to change your photo</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-slate-800">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input" />
              </div>
              <div>
                <label className="label">College / University</label>
                <input value={form.college} onChange={e => setForm(p => ({...p, college: e.target.value}))} placeholder="IIT Delhi" className="input" />
              </div>
              <div>
                <label className="label">City / Location</label>
                <input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="New Delhi" className="input" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="98XXXXXXXX" className="input" />
              </div>
              <div className="col-span-2">
                <label className="label">Bio</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))}
                  placeholder="Tell buyers about yourself..." rows={3} className="input resize-none" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={handlePasswordChange} className="card p-6 mt-6 space-y-4">
          <h2 className="font-display font-bold text-slate-800">Change Password</h2>
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({...p, currentPassword: e.target.value}))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({...p, newPassword: e.target.value}))} className="input" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} className="input" />
            </div>
          </div>
          <button type="submit" disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="btn-secondary disabled:opacity-60">
            {pwSaving ? 'Changing...' : '🔒 Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

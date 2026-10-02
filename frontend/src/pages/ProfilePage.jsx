import { useState } from 'react';
import { User, Mail, Phone, Shield, KeyRound, Save, Loader2, Lock } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      if (setUser) setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm);
      toast.success('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Failed to change password.';
      toast.error(msg);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account information and security
        </p>
      </div>

      {/* Header card */}
      <div className="card mb-6 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 border-slate-700">
        <div className="flex items-center gap-5">
          <Avatar name={user?.name} email={user?.email} role={user?.role} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{user?.name}</h2>
            <p className="text-sm text-slate-300 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 capitalize">
              <Shield size={11} /> {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card mb-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <User size={16} className="text-teal-600 dark:text-teal-400" />
          Personal Information
        </h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">Email (read-only)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="input pl-10 bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input pl-10"
                  placeholder="+91 9999999999"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-teal-600 dark:text-teal-400" />
          Change Password
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={pwForm.current_password}
                onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={savingPw} className="btn-primary">
              {savingPw ? (
                <><Loader2 size={14} className="animate-spin" /> Updating...</>
              ) : (
                <><KeyRound size={14} /> Update Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { User, Lock, Mail, Phone, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useSiteConfig } from '../../context/SiteConfigContext.js';
import { SEO } from '../../components/common/SEO.js';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { siteName } = useSiteConfig();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    try {
      setIsChangingPass(true);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <SEO
        title="My Profile & Security"
        description="Manage your account profile, contact details, security credentials, and active sessions."
      />
      <Header title="My Profile" subtitle="Account Settings" showBack />

      <div className="p-4 flex flex-col gap-4">
        {/* User Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-ios-blue text-white flex items-center justify-center font-bold text-xl shadow-glow flex-shrink-0">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{user?.name}</h3>
            <span className="text-xs text-slate-500 block">{user?.email}</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mt-0.5">
              Verified Patron
            </span>
          </div>
        </div>

        {/* Change Password */}
        <form
          onSubmit={handlePasswordChange}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-ios-blue" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Change Password
            </h4>
          </div>

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <ShimmerButton type="submit" size="md" isLoading={isChangingPass} className="w-full mt-2">
            Update Password
          </ShimmerButton>
        </form>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out of {siteName}
        </button>
      </div>
    </div>
  );
};

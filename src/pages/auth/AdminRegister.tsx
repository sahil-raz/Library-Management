import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, User, Mail, Phone, Lock, ArrowRight, MessageSquare, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Input } from '../../components/common/Input.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { Header } from '../../components/common/Header.js';
import { SEO } from '../../components/common/SEO.js';

export const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number first.');
      showToast('Enter a valid phone number', 'error');
      return;
    }

    try {
      setIsSendingOtp(true);
      setError('');
      const res = await api.post<{ success: boolean; message: string }>(
        '/public/admin/send-otp',
        { phone: formData.phone, email: formData.email }
      );

      setOtpSent(true);
      showToast(res.message || 'WhatsApp OTP sent successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to send WhatsApp OTP');
      showToast(err.message || 'Failed to send WhatsApp OTP', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.otp) {
      setError('Please enter the 6-digit WhatsApp verification OTP.');
      showToast('WhatsApp OTP is required', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await api.post<{ success: boolean; token: string; user: any }>(
        '/public/admin/register',
        {
          ...formData,
          whatsappNumber: formData.phone,
        }
      );

      if (res.token) {
        api.setToken(res.token);
        await refreshUser();
        showToast('Library registered! Now choose a SaaS plan to activate.', 'success');
        navigate('/admin/saas-purchase');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8 min-h-screen">
      <SEO
        title="Register Library"
        description="Register your library organization to start managing branches, seats, session timings, and student memberships."
      />
      <Header title="Library Registration" showBack onBack={() => navigate('/login')} />

      <div className="p-4 max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-3xl bg-ios-blue/10 text-ios-blue flex items-center justify-center mx-auto mb-2.5 shadow-sm">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Register Your Library</h2>
          <p className="text-xs text-slate-500 mt-1">
            Create an administrator account with verified phone and manage your study spaces.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 bg-white p-5 rounded-3xl border border-slate-200 shadow-ios">
          <Input
            label="Library / Organization Name"
            name="organizationName"
            placeholder="e.g. Apex Reading Library"
            value={formData.organizationName}
            onChange={handleChange}
            icon={<Building className="w-4 h-4" />}
            required
          />

          <Input
            label="Admin Full Name"
            name="name"
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={handleChange}
            icon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Official Email"
            name="email"
            type="email"
            placeholder="owner@apexlibrary.com"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          {/* Single Phone Number (WhatsApp-enabled) with OTP Trigger */}
          <div className="space-y-2">
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="10-digit WhatsApp number"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4" />}
              required
            />

            {/* OTP Trigger Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || !formData.phone}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending OTP...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" /> {otpSent ? 'Resend WhatsApp OTP' : 'Send WhatsApp OTP'}
                  </>
                )}
              </button>

              {otpSent && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> OTP Sent to WhatsApp
                </span>
              )}
            </div>

            {/* OTP Input Field */}
            {otpSent && (
              <div className="pt-1">
                <Input
                  label="Enter 6-Digit WhatsApp OTP"
                  name="otp"
                  type="text"
                  placeholder="e.g. 123456"
                  value={formData.otp}
                  onChange={handleChange}
                  icon={<Lock className="w-4 h-4 text-emerald-600" />}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <ShimmerButton
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
            disabled={!otpSent}
          >
            {otpSent ? 'Verify OTP & Register' : 'Send WhatsApp OTP to Continue'} <ArrowRight className="w-4 h-4 ml-1" />
          </ShimmerButton>
        </form>

        <div className="text-center mt-5">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800">
            Already have an account? <span className="font-semibold text-ios-blue">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

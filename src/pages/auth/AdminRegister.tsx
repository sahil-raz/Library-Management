import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
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
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await api.post<{ success: boolean; token: string; user: any }>(
        '/public/admin/register',
        formData
      );

      if (res.token) {
        api.setToken(res.token);
        await refreshUser();
        showToast('Account created! Now select a plan to activate your library.', 'success');
        navigate('/admin/plans');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-6">
      <SEO
        title="Register Library"
        description="Register your library organization to start managing branches, seats, staff, and student memberships."
      />
      <Header title="Library Registration" showBack onBack={() => navigate('/login')} />

      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-ios-blue/10 text-ios-blue flex items-center justify-center mx-auto mb-2">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Register Your Library</h2>
          <p className="text-xs text-slate-500 mt-1">
            Register your library organization to start managing branches, seats, and members.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
            label="Owner / Admin Full Name"
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

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4" />}
              required
            />

            <Input
              label="WhatsApp Number"
              name="whatsappNumber"
              type="tel"
              placeholder="9876543210"
              value={formData.whatsappNumber}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4" />}
              required
            />
          </div>

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

          <ShimmerButton type="submit" size="lg" isLoading={isLoading} className="w-full mt-3">
            Register & Continue <ArrowRight className="w-4 h-4 ml-1" />
          </ShimmerButton>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800">
            Already have an account? <span className="font-semibold text-ios-blue">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

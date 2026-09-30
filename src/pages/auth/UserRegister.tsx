import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Building, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Input } from '../../components/common/Input.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { Header } from '../../components/common/Header.js';
import { SEO } from '../../components/common/SEO.js';

export const UserRegister: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [libraries, setLibraries] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    adminId: '',
    branchId: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available active libraries
    api
      .get<{ success: boolean; libraries: any[] }>('/public/libraries')
      .then((res) => {
        if (res.success && res.libraries) {
          setLibraries(res.libraries);
          if (res.libraries.length > 0) {
            setFormData((prev) => ({ ...prev, adminId: res.libraries[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectedLibrary = libraries.find((l) => l.id === formData.adminId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adminId) {
      setError('Please select a library');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const res = await api.post<{ success: boolean; token: string; user: any }>(
        '/public/register',
        formData
      );

      if (res.token) {
        api.setToken(res.token);
        await refreshUser();
        showToast('Registration complete! Choose a membership plan to activate your seat.', 'success');
        navigate('/user/subscription');
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
        title="Student & Patron Registration"
        description="Join your local study library center, choose your membership pass, and reserve your dedicated study space."
      />
      <Header title="Patron Registration" showBack onBack={() => navigate('/login')} />

      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-ios-blue/10 text-ios-blue flex items-center justify-center mx-auto mb-2">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student & Patron Sign Up</h2>
          <p className="text-xs text-slate-500 mt-1">
            Join your local study library and reserve your study seat.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Library Selector */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Select Library / Study Center</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Building className="w-4 h-4" />
              </div>
              <select
                name="adminId"
                value={formData.adminId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue transition-all"
                required
              >
                {libraries.length === 0 && <option value="">Loading libraries...</option>}
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.organizationName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch Selector (if available) */}
          {selectedLibrary?.branches?.length > 0 && (
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">Select Preferred Branch</label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue transition-all"
              >
                <option value="">Any Branch</option>
                {selectedLibrary.branches.map((b: any) => (
                  <option key={b._id} value={b._id}>
                    {b.name} - {b.address}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Full Name"
            name="name"
            placeholder="e.g. Ananya Patel"
            value={formData.name}
            onChange={handleChange}
            icon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="ananya@example.com"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4" />}
              required
            />

            <Input
              label="WhatsApp"
              name="whatsappNumber"
              type="tel"
              placeholder="9876543210"
              value={formData.whatsappNumber}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              icon={<Calendar className="w-4 h-4" />}
            />

            <Input
              label="Emergency Contact"
              name="emergencyContact"
              placeholder="Guardian Phone"
              value={formData.emergencyContact}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Address"
            name="address"
            placeholder="City, Area"
            value={formData.address}
            onChange={handleChange}
            icon={<MapPin className="w-4 h-4" />}
          />

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

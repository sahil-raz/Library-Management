import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Input } from '../../components/common/Input.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { ShinyText } from '../../components/reactbits/ShinyText.js';
import { useSiteConfig } from '../../context/SiteConfigContext.js';
import { SEO } from '../../components/common/SEO.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { siteName, siteTagline } = useSiteConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const loggedUser = await login(email, password);

      if (loggedUser.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'MANAGER') {
        navigate('/manager');
      } else {
        setError('Student login has been disabled. Only administrators and staff may log in.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-between p-6 safe-top safe-bottom overflow-hidden max-w-md mx-auto w-full">
      <SEO
        title="Admin Sign In"
        description={`Secure administrator and staff login to ${siteName}. Manage library seating, timing batches, and memberships.`}
      />
      <div className="flex flex-col items-center text-center mt-3">
        <div className="w-16 h-16 rounded-3xl bg-ios-blue flex items-center justify-center text-white shadow-glow mb-3">
          <BookOpen className="w-8 h-8" />
        </div>
        <ShinyText text={siteName} className="text-2xl font-black tracking-tight" />
        <div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-ios-blue rounded-full text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Library Administration Portal</span>
        </div>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px]">
          {siteTagline}
        </p>
      </div>

      <div className="my-auto py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 bg-white p-5 rounded-3xl border border-slate-200 shadow-ios">
          {error && (
            <div className="p-3 text-xs font-semibold rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              {error}
            </div>
          )}

          <Input
            label="Administrator / Staff Email"
            type="email"
            placeholder="admin@apexlibrary.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
            required
          />

          <ShimmerButton type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
            Sign In to Console <ArrowRight className="w-4 h-4 ml-1" />
          </ShimmerButton>
        </form>
      </div>

      <div className="flex flex-col text-center pb-3">
        <Link
          to="/register/admin"
          className="w-full py-3 px-4 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200/80 active:scale-[0.99] text-slate-800 transition-all text-center flex items-center justify-center gap-2"
        >
          <span>Register New Library as Admin</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

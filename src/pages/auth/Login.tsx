import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, BookOpen, ArrowRight } from 'lucide-react';
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
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-between p-6 safe-top safe-bottom overflow-hidden">
      <SEO
        title="Sign In"
        description={`Secure 7-day login to your ${siteName} account. Access library management, seating, and memberships.`}
      />
      <div className="flex flex-col items-center text-center mt-2">
        <div className="w-14 h-14 rounded-2xl bg-ios-blue flex items-center justify-center text-white shadow-glow mb-3">
          <BookOpen className="w-7 h-7" />
        </div>
        <ShinyText text={siteName} className="text-2xl font-black tracking-tight" />
        <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
          {siteTagline}
        </p>
      </div>

      <div className="my-auto py-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {error && (
            <div className="p-3 text-xs font-semibold rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
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
            Sign In <ArrowRight className="w-4 h-4 ml-1" />
          </ShimmerButton>
        </form>
      </div>

      <div className="flex flex-col text-center pb-2">
        <Link
          to="/register/user"
          className="w-full py-3 px-4 text-xs font-semibold rounded-2xl bg-slate-100 hover:bg-slate-200/80 active:scale-[0.99] text-slate-800 transition-all text-center"
        >
          New Student / Member? Register Here
        </Link>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Armchair,
  Users,
  CreditCard,
  Send,
  AlertTriangle,
  Clock,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard.js';
import { AnimatedCounter } from '../../components/reactbits/AnimatedCounter.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { SEO } from '../../components/common/SEO.js';
import { useAuth } from '../../context/AuthContext.js';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; stats: any }>('/admin/dashboard')
      .then((res) => {
        if (res.success) setStats(res.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const usageStats = stats?.usageStats;
  const hasActivePlan = usageStats?.hasActivePlan;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <SEO
        title={user?.organizationName ? `${user.organizationName} Dashboard` : 'Library Admin Dashboard'}
        description="Monitor real-time seat occupancy, member check-ins, active subscriptions, and branch operations."
      />
      <Header
        title={user?.organizationName || 'Library Console'}
        subtitle="Library Operations & Capacity"
      />

      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : (
          <>
            {/* Subscription Status Banner */}
            {!hasActivePlan ? (
              <div className="p-4 rounded-3xl bg-amber-500 text-white shadow-ios flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-200" />
                  <div>
                    <h3 className="text-sm font-bold leading-tight">No Active Subscription</h3>
                    <p className="text-xs text-amber-100">Unlock multiple branches, seats & managers.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/saas-purchase')}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-sm active:scale-95 transition-all flex-shrink-0"
                >
                  Buy Plan
                </button>
              </div>
            ) : (
              <SpotlightCard className="bg-gradient-to-br from-ios-blue to-blue-700 text-white border-none shadow-glow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span className="text-xs font-semibold text-sky-100 uppercase tracking-wider">
                      {usageStats.planName}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-xs text-blue-100 block">Valid until</span>
                    <span className="text-sm font-bold text-white">
                      {new Date(usageStats.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xl font-black text-white">
                    {usageStats.daysRemaining} days left
                  </span>
                </div>

                {/* Quota Usage Progress Grid */}
                <div className="space-y-2.5 pt-3 border-t border-white/20 text-xs">
                  {[
                    { label: 'Branches', ...usageStats.branches },
                    { label: 'Staff / Managers', ...usageStats.managers },
                    { label: 'Students / Users', ...usageStats.users },
                    { label: 'Seats', ...usageStats.seats },
                  ].map((item, idx) => {
                    const pct = item.max > 0 ? Math.min(100, Math.round((item.current / item.max) * 100)) : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between font-medium text-sky-100 mb-0.5">
                          <span>{item.label}</span>
                          <span>
                            {item.current} / {item.max}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 90 ? 'bg-amber-300' : 'bg-white'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SpotlightCard>
            )}

            {/* Quick Action Matrix */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate('/admin/branches')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Branches</span>
                  <span className="text-[10px] text-slate-400">
                    {stats?.branchesCount || 0} Configured
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/seats')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Seat Grid</span>
                  <span className="text-[10px] text-slate-400">
                    {stats?.activeSeatsCount || 0} / {stats?.totalSeatsCount || 0} Filled
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/plans')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-blue-50 text-ios-blue">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Student Plans</span>
                  <span className="text-[10px] text-slate-400">
                    {stats?.userPlansCount || 0} Tiers Active
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/payments')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 relative">
                  <CreditCard className="w-5 h-5" />
                  {stats?.pendingPaymentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Patron Dues</span>
                  <span className="text-[10px] text-amber-600 font-semibold">
                    {stats?.pendingPaymentsCount} Review Dues
                  </span>
                </div>
              </button>
            </div>

            {/* Library Operational Stats (Clickable to open search lists) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin/users')}
                className="text-left w-full active:scale-95 transition-all group"
              >
                <SpotlightCard className="h-full border border-slate-200/90 group-hover:border-ios-blue/50 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Active Students</span>
                    <Users className="w-4 h-4 text-ios-blue" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter value={stats?.activeUsersCount || 0} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400">
                      Total: {stats?.totalUsersCount || 0}
                    </span>
                    <span className="font-semibold text-ios-blue flex items-center">
                      Search <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </SpotlightCard>
              </button>

              <button
                onClick={() => navigate('/admin/seats')}
                className="text-left w-full active:scale-95 transition-all group"
              >
                <SpotlightCard className="h-full border border-slate-200/90 group-hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Seat Occupancy</span>
                    <Armchair className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.totalSeatsCount > 0
                      ? Math.round((stats.activeSeatsCount / stats.totalSeatsCount) * 100)
                      : 0}
                    %
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400">
                      {stats?.activeSeatsCount || 0}/{stats?.totalSeatsCount || 0} filled
                    </span>
                    <span className="font-semibold text-purple-600 flex items-center">
                      Search <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </SpotlightCard>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

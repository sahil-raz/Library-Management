import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Layers,
  CreditCard,
  IndianRupee,
  Activity,
  PlusCircle,
  Settings,
  ShieldCheck,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard.js';
import { AnimatedCounter } from '../../components/reactbits/AnimatedCounter.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { SEO } from '../../components/common/SEO.js';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; metrics: any }>('/superadmin/metrics')
      .then((res) => {
        if (res.success) setMetrics(res.metrics);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <SEO
        title="Super Admin Dashboard"
        description="Platform command center for managing library organizations, subscriptions, payments, and system health."
      />
      <Header
        title="Super Admin"
        subtitle="Platform Overview & Control"
        rightAction={
          <button
            onClick={() => navigate('/superadmin/settings')}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-all active:scale-95"
            title="UPI / QR Payment Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : (
          <>
            {/* Top Revenue Spotlight Card */}
            <SpotlightCard className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-ios-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total Revenue
                </span>
                <span className="p-1.5 rounded-xl bg-white/10 text-emerald-400">
                  <IndianRupee className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-white mb-2">
                <AnimatedCounter value={metrics?.totalRevenue || 0} prefix="₹" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-300">
                <span>Approved Payments: {metrics?.approvedPayments || 0}</span>
                <span className="text-amber-300 font-semibold">
                  Pending: {metrics?.pendingPayments || 0}
                </span>
              </div>
            </SpotlightCard>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate('/superadmin/plans/new')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-blue-50 text-ios-blue">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Create Plan</span>
                  <span className="text-[10px] text-slate-400">Pricing & Quotas</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/superadmin/payments')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 relative">
                  <CreditCard className="w-5 h-5" />
                  {metrics?.pendingPayments > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Review Pay</span>
                  <span className="text-[10px] text-amber-600 font-semibold">
                    {metrics?.pendingPayments} Pending
                  </span>
                </div>
              </button>
            </div>

            {/* Platform Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <SpotlightCard
                onClick={() => navigate('/superadmin/admins')}
                className="cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-semibold text-slate-500">Libraries</span>
                  <Users className="w-4 h-4 text-ios-blue" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  <AnimatedCounter value={metrics?.totalAdmins || 0} />
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {metrics?.activeAdmins || 0} Active
                </span>
              </SpotlightCard>

              <SpotlightCard>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-semibold text-slate-500">Total Branches</span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  <AnimatedCounter value={metrics?.totalBranches || 0} />
                </div>
                <span className="text-[10px] text-slate-400">Physical Centers</span>
              </SpotlightCard>

              <SpotlightCard>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-semibold text-slate-500">Staff / Managers</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  <AnimatedCounter value={metrics?.totalManagers || 0} />
                </div>
                <span className="text-[10px] text-slate-400">Branch Operators</span>
              </SpotlightCard>

              <SpotlightCard>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-semibold text-slate-500">Students / Users</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  <AnimatedCounter value={metrics?.totalUsers || 0} />
                </div>
                <span className="text-[10px] text-slate-400">Enrolled Patrons</span>
              </SpotlightCard>
            </div>

            {/* Recent Platform Activity */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recent Audit Activity
                </span>
                <button
                  onClick={() => navigate('/superadmin/activity')}
                  className="text-xs font-semibold text-ios-blue hover:underline flex items-center gap-0.5"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {metrics?.recentActivity?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
                    No recent activity logged
                  </div>
                ) : (
                  metrics?.recentActivity?.slice(0, 5).map((act: any) => (
                    <div
                      key={act._id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="block text-xs font-bold text-slate-800 truncate">
                            {act.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {act.actorName} ({act.actorRole})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(act.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

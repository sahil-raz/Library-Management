import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Armchair, Clock, Receipt, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard.js';
import { AnimatedCounter } from '../../components/reactbits/AnimatedCounter.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { useAuth } from '../../context/AuthContext.js';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; [key: string]: any }>('/manager/dashboard')
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const perms = user?.permissions || data?.permissions || {};
  const branch = data?.branch;
  const metrics = data?.metrics;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <Header
        title={branch?.name || 'Staff Console'}
        subtitle="Assigned Branch Operations"
      />

      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : (
          <>
            {/* Branch Identification Card */}
            <SpotlightCard className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-ios-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">
                  Assigned Branch
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  STAFF MODE
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{branch?.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-indigo-100 mt-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
                <span className="truncate">{branch?.address}</span>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-indigo-200">
                <span>Hours: {branch?.openingTime} - {branch?.closingTime}</span>
                <span>Contact: {branch?.phone}</span>
              </div>
            </SpotlightCard>

            {/* Branch Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {perms.users_view && (
                <SpotlightCard
                  onClick={() => navigate('/manager/users')}
                  className="cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Branch Students</span>
                    <Users className="w-4 h-4 text-ios-blue" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter value={metrics?.totalUsers || 0} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {metrics?.activeUsers || 0} Active
                  </span>
                </SpotlightCard>
              )}

              {perms.seats_view && (
                <SpotlightCard
                  onClick={() => navigate('/manager/seats')}
                  className="cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Seat Occupancy</span>
                    <Armchair className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter value={metrics?.assignedSeats || 0} />
                    <span className="text-xs font-medium text-slate-400"> / {metrics?.totalSeats || 0}</span>
                  </div>
                  <span className="text-[10px] text-ios-blue font-semibold">
                    {metrics?.availableSeats || 0} Available
                  </span>
                </SpotlightCard>
              )}

              {perms.queue_manage && (
                <SpotlightCard
                  onClick={() => navigate('/manager/queue')}
                  className="cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Waitlist Queue</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter value={metrics?.waitingQueue || 0} />
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold">Waiting</span>
                </SpotlightCard>
              )}

              {perms.expenses_view && (
                <SpotlightCard
                  onClick={() => navigate('/manager/expenses')}
                  className="cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-semibold text-slate-500">Branch Expenses</span>
                    <Receipt className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Utilities & Bills</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Tap to inspect</span>
                </SpotlightCard>
              )}
            </div>

            {/* Granular Permissions Indicator */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Access Level & Roles
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Configured by Library Administrator
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Staff Verified
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Armchair,
  CreditCard,
  Building2,
  Clock,
  Bell,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { SEO } from '../../components/common/SEO.js';
import { useAuth } from '../../context/AuthContext.js';

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; dashboard: any }>('/user/dashboard')
      .then((res) => {
        if (res.success) setData(res.dashboard);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const subscription = data?.subscription;
  const seat = data?.seat;
  const branch = data?.branch;
  const daysRemaining = data?.daysRemaining || 0;
  const unreadNotifications = data?.unreadNotifications || 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <SEO
        title="My Study Center & Pass"
        description="View your active library membership, reserved study seat, check-in history, and validity days remaining."
      />
      <Header
        title="My Study Center"
        subtitle={`Welcome, ${user?.name}`}
        rightAction={
          <button
            onClick={() => navigate('/user/notifications')}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-700 relative active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            )}
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : (
          <>
            {/* Membership Pass Card */}
            {subscription ? (
              <SpotlightCard className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-none shadow-ios-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Study Membership
                    </span>
                  </div>
                  <PulseBadge status="ACTIVE" size="sm" />
                </div>

                <h2 className="text-xl font-black text-white tracking-tight">
                  {subscription.planSnapshot?.name || 'Library Pass'}
                </h2>

                <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">
                      Valid Until
                    </span>
                    <span className="text-xs font-bold text-white">
                      {new Date(subscription.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">{daysRemaining}</span>
                    <span className="text-[10px] text-slate-300 block font-medium">days left</span>
                  </div>
                </div>
              </SpotlightCard>
            ) : (
              <div className="p-5 rounded-3xl bg-amber-500 text-white shadow-ios flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                  <h3 className="text-sm font-bold">No Active Membership</h3>
                </div>
                <p className="text-xs text-amber-100">
                  Select a subscription plan to access study halls and reserve your seat.
                </p>
                <button
                  onClick={() => navigate('/user/subscription')}
                  className="w-full py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs active:scale-95 transition-all text-center shadow-sm"
                >
                  Browse Membership Plans
                </button>
              </div>
            )}

            {/* Allocated Seat & Branch Cards */}
            <div className="grid grid-cols-2 gap-3">
              <SpotlightCard
                onClick={() => navigate('/user/seat')}
                className="cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-semibold text-slate-500">Reserved Desk</span>
                  <Armchair className="w-4 h-4 text-purple-600" />
                </div>
                {seat ? (
                  <>
                    <div className="text-2xl font-black text-slate-900">{seat.seatNumber}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">Reserved For You</span>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-slate-400 mt-2">Unassigned</div>
                    <span className="text-[10px] text-slate-400">Ask branch admin</span>
                  </>
                )}
              </SpotlightCard>

              <SpotlightCard>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-semibold text-slate-500">Entry Status</span>
                  <CheckCircle2 className="w-4 h-4 text-ios-blue" />
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-1">
                  {user?.entryStatus || 'ACTIVE'}
                </div>
                <span className="text-[10px] text-slate-400">Gate / Check-in</span>
              </SpotlightCard>
            </div>

            {/* Branch Details */}
            {branch && (
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{branch.name}</h4>
                      <span className="text-[10px] text-slate-400 block">{branch.address}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {branch.openingTime} - {branch.closingTime}
                  </span>
                  <span>Contact: {branch.phone}</span>
                </div>
              </div>
            )}

            {/* Quick Renewal Action */}
            <div
              onClick={() => navigate('/user/subscription')}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex items-center justify-between cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-ios-blue">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Manage Subscription & Dues</h4>
                  <span className="text-[10px] text-slate-400">Pay monthly fees via UPI</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

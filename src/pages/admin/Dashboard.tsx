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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  MessageSquare,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SpotlightCard } from '../../components/reactbits/SpotlightCard.js';
import { AnimatedCounter } from '../../components/reactbits/AnimatedCounter.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { SEO } from '../../components/common/SEO.js';
import { useAuth } from '../../context/AuthContext.js';
import { BatchOccupancyModal } from '../../components/admin/BatchOccupancyModal.js';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal.js';
import { IDCardModal } from '../../components/common/IDCardModal.js';
import { RenewPlanModal } from '../../components/admin/RenewPlanModal.js';
import { SendWhatsAppModal } from '../../components/admin/SendWhatsAppModal.js';

const FILTER_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_6_months', label: 'Last 6 Months' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all_time', label: 'All Time' },
];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('this_month');

  // Interactive Linking Modals
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [idCardData, setIdCardData] = useState<any>(null);
  const [studentToRenew, setStudentToRenew] = useState<any>(null);
  const [studentToSendWhatsApp, setStudentToSendWhatsApp] = useState<any>(null);

  const fetchDashboardStats = (filterKey: string) => {
    setLoading(true);
    api
      .get<{ success: boolean; stats: any }>(`/admin/dashboard?filter=${filterKey}`)
      .then((res) => {
        if (res.success) setStats(res.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardStats(selectedFilter);
  }, [selectedFilter]);

  const handleOpenIdCard = async (student: any) => {
    try {
      const res = await api.get<{ success: boolean; idCard: any }>(`/admin/users/${student._id}/id-card`);
      if (res.success) {
        setIdCardData(res.idCard);
      }
    } catch (err) {
      console.error('Failed to fetch ID card data:', err);
    }
  };

  const usageStats = stats?.usageStats;
  const hasActivePlan = usageStats?.hasActivePlan;
  const financials = stats?.financials || { totalIncome: 0, totalExpenses: 0, netRevenue: 0, label: 'This Month' };
  const waAlerts = stats?.whatsappAlerts || { used: 0, limit: 500, remaining: 500 };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-12">
      <SEO
        title={user?.organizationName ? `${user.organizationName} Dashboard` : 'Library Admin Dashboard'}
        description="Monitor real-time income, expenses, seat occupancy, member batches, and automated WhatsApp alerts."
      />
      <Header
        title={user?.organizationName || 'Library Console'}
        subtitle="Library Operations & Financials"
      />

      <div className="p-4 flex flex-col gap-4">
        {loading && !stats ? (
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
                    <p className="text-xs text-amber-100">Unlock multiple branches, seats, timings & WhatsApp alerts.</p>
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
                      {usageStats?.planName}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-xs text-blue-100 block">Valid until</span>
                    <span className="text-sm font-bold text-white">
                      {new Date(usageStats?.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xl font-black text-white">
                    {usageStats?.daysRemaining} days left
                  </span>
                </div>

                {/* Quota Usage Progress Grid */}
                <div className="space-y-2 pt-2.5 border-t border-white/20 text-xs">
                  {[
                    { label: 'Branches', ...usageStats?.branches },
                    { label: 'Staff / Managers', ...usageStats?.managers },
                    { label: 'Students / Patrons', ...usageStats?.users },
                    { label: 'Seats', ...usageStats?.seats },
                  ].map((item, idx) => {
                    const pct = item.max > 0 ? Math.min(100, Math.round((item.current / item.max) * 100)) : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between font-medium text-sky-100 mb-0.5 text-[11px]">
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

            {/* Financial Overview (Income, Expenses & Net Revenue) */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Financial Performance</h3>
                    <p className="text-[10px] text-slate-500">Real-time library cash flow</p>
                  </div>
                </div>

                {/* Filter Indicator Badge */}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                  {financials.label}
                </span>
              </div>

              {/* Time Period Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedFilter(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                      selectedFilter === opt.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* Total Income */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block uppercase">Income</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block truncate">
                    ₹{financials.totalIncome.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">Admissions & Renewals</span>
                </div>

                {/* Total Expenses */}
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 block uppercase">Expenses</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block truncate">
                    ₹{financials.totalExpenses.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-rose-600 font-semibold">Bills & Upkeep</span>
                </div>

                {/* Net Revenue */}
                <div
                  className={`p-3 rounded-2xl border ${
                    financials.netRevenue >= 0
                      ? 'bg-blue-50/70 border-blue-100 text-blue-900'
                      : 'bg-amber-50/70 border-amber-100 text-amber-900'
                  }`}
                >
                  <span className="text-[10px] font-bold block uppercase text-slate-500">Net Revenue</span>
                  <span
                    className={`text-base font-black mt-0.5 block truncate ${
                      financials.netRevenue >= 0 ? 'text-ios-blue' : 'text-rose-600'
                    }`}
                  >
                    ₹{financials.netRevenue.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">Income - Expenses</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Alerts Quota Card */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">WhatsApp Alert Limit</h3>
                    <p className="text-[10px] text-slate-500">Expiry reminders & student alerts</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    waAlerts.remaining <= 20
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {waAlerts.remaining} Remaining
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Total Sent by System & Admin</span>
                <span>
                  {waAlerts.used} / {waAlerts.limit} Alerts
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((waAlerts.used / Math.max(1, waAlerts.limit)) * 100))}%`,
                  }}
                />
              </div>
            </div>

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
                  <span className="block text-xs font-bold text-slate-900">Seat Timings</span>
                  <span className="text-[10px] text-slate-400">
                    {stats?.activeSeatsCount || 0} Filled in Batches
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
                onClick={() => navigate('/admin/expenses')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-ios active:scale-95 transition-all text-left"
              >
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Expenses</span>
                  <span className="text-[10px] text-rose-600 font-semibold">
                    Manage Outflow
                  </span>
                </div>
              </button>
            </div>

            {/* Operational Stats: Clickable to Open User List & Seat Grid */}
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
                      View All <ChevronRight className="w-3 h-3" />
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
                    <span className="text-xs font-semibold text-slate-500">Seat Allocations</span>
                    <Armchair className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter value={stats?.activeSeatsCount || 0} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400">
                      Across all batches
                    </span>
                    <span className="font-semibold text-purple-600 flex items-center">
                      Seat Grid <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </SpotlightCard>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Linked Drill-Down Modals */}
      <BatchOccupancyModal
        isOpen={!!selectedSeatId}
        seatId={selectedSeatId}
        onClose={() => setSelectedSeatId(null)}
        onSelectStudent={(student) => setSelectedStudent(student)}
      />

      <StudentDetailModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onGenerateIdCard={(student) => handleOpenIdCard(student)}
        onRenewPlan={(student) => setStudentToRenew(student)}
        onSendWhatsApp={(student) => setStudentToSendWhatsApp(student)}
      />

      <IDCardModal
        isOpen={!!idCardData}
        idCardData={idCardData}
        onClose={() => setIdCardData(null)}
      />

      <RenewPlanModal
        isOpen={!!studentToRenew}
        student={studentToRenew}
        onClose={() => setStudentToRenew(null)}
        onSuccess={() => fetchDashboardStats(selectedFilter)}
      />

      <SendWhatsAppModal
        isOpen={!!studentToSendWhatsApp}
        student={studentToSendWhatsApp}
        onClose={() => setStudentToSendWhatsApp(null)}
        onSuccess={() => fetchDashboardStats(selectedFilter)}
      />
    </div>
  );
};

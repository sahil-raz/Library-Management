import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  CreditCard,
  Users,
  Armchair,
  Layers,
  Receipt,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { useToast } from '../../context/ToastContext.js';

type Tab =
  | 'profile'
  | 'subscription'
  | 'payments'
  | 'branches'
  | 'managers'
  | 'users'
  | 'plans'
  | 'seats'
  | 'expenses'
  | 'activity';

export const AdminDetail: React.FC = () => {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) return;
    setLoading(true);
    api
      .get<{ success: boolean; [key: string]: any }>(`/superadmin/admins/${adminId}`)
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((err) => {
        showToast(err.message || 'Failed to load library admin details', 'error');
      })
      .finally(() => setLoading(false));
  }, [adminId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <Header title="Admin Details" showBack />
        <div className="p-4 flex flex-col gap-3">
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
        </div>
      </div>
    );
  }

  const {
    admin,
    usageStats,
    subscription,
    payments,
    branches,
    managers,
    users,
    plans,
    seats,
    expenses,
    activity,
  } = data || {};

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'subscription', label: 'Plan & Limits' },
    { id: 'payments', label: 'Payments', count: payments?.length },
    { id: 'branches', label: 'Branches', count: branches?.length },
    { id: 'managers', label: 'Managers', count: managers?.length },
    { id: 'users', label: 'Users', count: users?.length },
    { id: 'plans', label: 'User Plans', count: plans?.length },
    { id: 'seats', label: 'Seats', count: seats?.length },
    { id: 'expenses', label: 'Expenses', count: expenses?.length },
    { id: 'activity', label: 'Audit Trail', count: activity?.length },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title={admin?.organizationName || 'Library Detail'}
        subtitle={`Owner: ${admin?.name || ''}`}
        showBack
      />

      {/* Horizontal Scrollable Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
              activeTab === tab.id
                ? 'bg-ios-blue text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-3">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-ios">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Organization Profile</h3>
                <PulseBadge status={admin?.status} />
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Library Name</span>
                  <span className="font-bold text-slate-800 text-sm">{admin?.organizationName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Primary Contact / Owner</span>
                  <span className="font-semibold text-slate-800">{admin?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-semibold text-slate-800">{admin?.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone</span>
                    <span className="font-semibold text-slate-800">{admin?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">WhatsApp</span>
                    <span className="font-semibold text-slate-800">{admin?.whatsappNumber}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registered On</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(admin?.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Subscription & Limits */}
        {activeTab === 'subscription' && (
          <div className="flex flex-col gap-3">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-ios">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-slate-400 block">Current Plan</span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {usageStats?.planName || 'No Active Plan'}
                  </h3>
                </div>
                <PulseBadge status={usageStats?.hasActivePlan ? 'ACTIVE' : 'EXPIRED'} />
              </div>

              {usageStats?.expiresAt && (
                <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span>Expires on: </span>
                  <strong className="text-slate-800">
                    {new Date(usageStats.expiresAt).toLocaleDateString()}
                  </strong>{' '}
                  ({usageStats.daysRemaining} days left)
                </div>
              )}

              {/* Progress bars for limits */}
              <div className="space-y-3.5 mt-2">
                {[
                  { label: 'Branches', ...usageStats?.branches },
                  { label: 'Managers', ...usageStats?.managers },
                  { label: 'Students / Users', ...usageStats?.users },
                  { label: 'Seats', ...usageStats?.seats },
                  { label: 'Messages', ...usageStats?.messages },
                  { label: 'Queue Entries', ...usageStats?.queue },
                ].map((item, idx) => {
                  const pct = item.max > 0 ? Math.min(100, Math.round((item.current / item.max) * 100)) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="text-slate-500">
                          {item.current} / {item.max}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-ios-blue'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payments */}
        {activeTab === 'payments' && (
          <div className="flex flex-col gap-2.5">
            {payments?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No payments submitted
              </div>
            ) : (
              payments?.map((p: any) => (
                <div key={p._id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{p.planName}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(p.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">₹{p.amount}</span>
                      <div className="mt-0.5">
                        <PulseBadge status={p.status} size="sm" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span>UTR: <strong className="text-slate-700 font-mono">{p.utr}</strong></span>
                    {p.screenshot && (
                      <a
                        href={p.screenshot}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ios-blue font-bold hover:underline"
                      >
                        View Receipt
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Branches */}
        {activeTab === 'branches' && (
          <div className="flex flex-col gap-2.5">
            {branches?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No branches created
              </div>
            ) : (
              branches?.map((b: any) => (
                <div key={b._id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                    <PulseBadge status={b.status} size="sm" />
                  </div>
                  <span className="text-xs text-slate-500">{b.address}</span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Hours: {b.openingTime} - {b.closingTime}</span>
                    <span>Phone: {b.phone}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Managers */}
        {activeTab === 'managers' && (
          <div className="flex flex-col gap-2.5">
            {managers?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No managers added
              </div>
            ) : (
              managers?.map((m: any) => (
                <div key={m._id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                    <span className="text-[11px] text-slate-500 block">{m.email}</span>
                    <span className="text-[10px] text-ios-blue font-semibold mt-0.5 block">
                      Branch: {m.branchId?.name || 'Unassigned'}
                    </span>
                  </div>
                  <PulseBadge status={m.status} size="sm" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 6: Users */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-2.5">
            {users?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No patrons registered
              </div>
            ) : (
              users?.map((u: any) => (
                <div key={u._id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{u.name}</h4>
                    <span className="text-[11px] text-slate-500">{u.email} • {u.phone}</span>
                  </div>
                  <PulseBadge status={u.entryStatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} label={u.entryStatus} size="sm" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 7: Plans */}
        {activeTab === 'plans' && (
          <div className="flex flex-col gap-2.5">
            {plans?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No user plans created
              </div>
            ) : (
              plans?.map((pl: any) => (
                <div key={pl._id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{pl.name}</h4>
                    <span className="text-xs text-slate-500">
                      {pl.validity} {pl.validityUnit}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">₹{pl.price}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 8: Seats */}
        {activeTab === 'seats' && (
          <div className="grid grid-cols-3 gap-2">
            {seats?.length === 0 ? (
              <div className="col-span-3 p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No seats configured
              </div>
            ) : (
              seats?.map((st: any) => (
                <div
                  key={st._id}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center ${
                    st.status === 'ASSIGNED'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="text-xs font-black">{st.seatNumber}</span>
                  <span className="text-[10px] uppercase font-bold opacity-80 mt-0.5">{st.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 9: Expenses */}
        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-2.5">
            {expenses?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No expenses recorded
              </div>
            ) : (
              expenses?.map((ex: any) => (
                <div key={ex._id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{ex.title}</h4>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(ex.date).toLocaleDateString()} • {ex.category}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-600">₹{ex.amount}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 10: Audit Trail */}
        {activeTab === 'activity' && (
          <div className="flex flex-col gap-2">
            {activity?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border">
                No activity records
              </div>
            ) : (
              activity?.map((act: any) => (
                <div key={act._id} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{act.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-400">
                      By {act.actorName} ({act.actorRole})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

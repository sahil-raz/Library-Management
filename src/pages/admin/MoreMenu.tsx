import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  CreditCard,
  Clock,
  Receipt,
  Send,
  Settings,
  Sparkles,
  Activity,
  ChevronRight,
  LogOut,
  Building2,
} from 'lucide-react';
import { Header } from '../../components/common/Header.js';
import { useAuth } from '../../context/AuthContext.js';

export const MoreMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Management & Staff',
      items: [
        {
          label: 'Staff Managers & Permissions',
          icon: Users,
          color: 'text-indigo-600 bg-indigo-50',
          path: '/admin/managers',
          badge: 'Staff',
        },
        {
          label: 'Waiting Queue & Direct Entry',
          icon: Clock,
          color: 'text-amber-600 bg-amber-50',
          path: '/admin/queue',
        },
        {
          label: 'Branch Expenses',
          icon: Receipt,
          color: 'text-rose-600 bg-rose-50',
          path: '/admin/expenses',
        },
      ],
    },
    {
      title: 'Plans & Payments',
      items: [
        {
          label: 'Student Membership Plans',
          icon: Layers,
          color: 'text-ios-blue bg-blue-50',
          path: '/admin/plans',
          badge: 'Students',
        },
        {
          label: 'Review Patron Payments',
          icon: CreditCard,
          color: 'text-emerald-600 bg-emerald-50',
          path: '/admin/payments',
        },
        {
          label: 'Payment Gateway (UPI / QR)',
          icon: Settings,
          color: 'text-slate-700 bg-slate-100',
          path: '/admin/settings',
        },
        {
          label: 'My SaaS License & Upgrades',
          icon: Sparkles,
          color: 'text-purple-600 bg-purple-50',
          path: '/admin/saas-purchase',
          badge: 'SaaS',
        },
      ],
    },
    {
      title: 'Communication & Audits',
      items: [
        {
          label: 'WhatsApp Expiry Reminders',
          icon: Send,
          color: 'text-emerald-600 bg-emerald-50',
          path: '/admin/reminders',
        },
        {
          label: 'Activity & Security Audit Trail',
          icon: Activity,
          color: 'text-slate-600 bg-slate-100',
          path: '/admin/audit',
        },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="More Options" subtitle={user?.organizationName || 'Library Console'} />

      <div className="p-4 flex flex-col gap-5">
        {/* User Card */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ios-blue text-white flex items-center justify-center font-bold text-lg">
              {user?.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
              <span className="text-xs text-slate-500 block">{user?.email}</span>
              <span className="text-[10px] font-bold text-ios-blue uppercase tracking-wider mt-0.5 block">
                Library Administrator
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-2xl text-rose-500 hover:bg-rose-50 active:scale-95 transition-all"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped iOS sections */}
        {sections.map((sec, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-3">
              {sec.title}
            </span>
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-ios divide-y divide-slate-100 overflow-hidden">
              {sec.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

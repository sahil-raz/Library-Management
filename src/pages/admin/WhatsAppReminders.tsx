import React, { useEffect, useState } from 'react';
import { Send, Clock, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useToast } from '../../context/ToastContext.js';

export const WhatsAppReminders: React.FC = () => {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; reminders: any[] }>('/admin/reminders');
      if (res.success) setReminders(res.reminders);
    } catch (err: any) {
      showToast(err.message || 'Failed to load reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleOpenReminder = async (rem: any) => {
    try {
      // Mark as opened in backend to audit and track
      await api.post(`/admin/reminders/${rem._id}/open`);
      setReminders((prev) =>
        prev.map((r) => (r._id === rem._id ? { ...r, status: 'OPENED', openedAt: new Date() } : r))
      );
    } catch {
      // Continue opening even if network blip
    }

    // Open dynamic WhatsApp wa.me link in new tab
    window.open(rem.waLink, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="WhatsApp Alerts" subtitle="Auto-Generated Expiry Reminders" showBack />

      <div className="p-4 flex flex-col gap-3">
        {/* Info banner */}
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <Send className="w-4 h-4 text-emerald-600" />
            <span>Smart Expiry Trigger</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            The system continuously inspects active subscriptions and generates personalized renewal links
            2 days before expiry and on the expiry day. Tap "Send via WhatsApp" to open the pre-filled message.
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading expiry alerts...</div>
        ) : reminders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">All Subscriptions Active & Healthy</h3>
            <p className="text-xs text-slate-400 mt-1">
              No memberships are due for renewal within the next 2 days.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reminders.map((rem) => {
              const isDueToday = rem.type === 'DAY_OF_EXPIRY';
              return (
                <div
                  key={rem._id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rem.userName}</h4>
                      <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                        +{rem.whatsappNumber}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isDueToday ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isDueToday ? 'EXPIRES TODAY' : '2 DAYS LEFT'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                    "{rem.messageText}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Status:{' '}
                      <strong className={rem.status === 'OPENED' ? 'text-emerald-600' : 'text-slate-700'}>
                        {rem.status}
                      </strong>
                    </span>

                    <button
                      onClick={() => handleOpenReminder(rem)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Send via WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

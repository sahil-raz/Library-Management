import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Clock, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { useToast } from '../../context/ToastContext.js';

export const UserNotifications: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; notifications: any[] }>('/user/notifications');
      if (res.success) setNotifications(res.notifications);
    } catch (err: any) {
      showToast(err.message || 'Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/user/notifications/all/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All marked as read', 'info');
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Notifications"
        subtitle="In-App Alerts & Activity"
        showBack
        rightAction={
          <button
            onClick={markAllRead}
            className="p-2 rounded-full text-ios-blue text-xs font-bold hover:bg-blue-50 active:scale-95 transition-all"
            title="Mark all as read"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-2.5">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No New Notifications</h3>
            <p className="text-xs text-slate-400 mt-1">Updates regarding your fees and seat will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-3xl border transition-all flex flex-col gap-1.5 ${
                n.isRead ? 'bg-white border-slate-200 shadow-sm' : 'bg-blue-50/70 border-blue-200 shadow-ios'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 tracking-tight">{n.title}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

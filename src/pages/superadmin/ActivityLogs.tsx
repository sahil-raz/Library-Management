import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, User, Calendar, Filter } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.append('action', actionFilter);

    api
      .get<{ success: boolean; logs: any[] }>(`/superadmin/activity?${params}`)
      .then((res) => {
        if (res.success) setLogs(res.logs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="Platform Activity" subtitle="Complete Security Audit Trail" />

      <div className="p-4 flex flex-col gap-3">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="">All Platform Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="ADMIN_CREATED">ADMIN_CREATED</option>
            <option value="PLAN_PURCHASED">PLAN_PURCHASED</option>
            <option value="PAYMENT_APPROVED">PAYMENT_APPROVED</option>
            <option value="PAYMENT_REJECTED">PAYMENT_REJECTED</option>
            <option value="BRANCH_CREATED">BRANCH_CREATED</option>
            <option value="MANAGER_CREATED">MANAGER_CREATED</option>
          </select>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="flex flex-col gap-2">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Activity Logs</h3>
            <p className="text-xs text-slate-400 mt-1">Actions taken across the platform will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 tracking-wide">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Actor: <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.ip || 'Local'}</span>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-1 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-600 truncate">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

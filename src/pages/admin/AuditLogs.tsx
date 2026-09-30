import React, { useEffect, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; logs: any[] }>('/admin/audit')
      .then((res) => {
        if (res.success) setLogs(res.logs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="Audit Trail" subtitle="Library Activity History" showBack />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-2">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Activity Logs</h3>
            <p className="text-xs text-slate-400 mt-1">Actions in your library will be logged here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    By: <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole})
                  </span>
                  <span className="text-[10px] text-slate-400">{log.target}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

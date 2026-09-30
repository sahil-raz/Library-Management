import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, User, Phone, Mail, ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SEO } from '../../components/common/SEO.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { SkeletonLoader } from '../../components/reactbits/SkeletonLoader.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminsList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<{ success: boolean; admins: any[] }>(`/superadmin/admins?${params}`);
      if (res.success) setAdmins(res.admins);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch library admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAdmins, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const toggleStatus = async (adminId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/superadmin/admins/${adminId}/status`, { status: newStatus });
      showToast(`Admin account marked as ${newStatus}`, 'success');
      setAdmins((prev) =>
        prev.map((a) => (a._id === adminId ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <SEO
        title="Manage Library Admins"
        description="Inspect, review, and manage library accounts, active subscriptions, and administrative access."
      />
      <Header title="Library Admins" subtitle="Manage Organization Accounts" />

      <div className="p-4 flex flex-col gap-3">
        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, org, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Library Admins Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Try adjusting your search criteria' : 'Registered library owners will appear here'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {admins.map((admin) => (
              <div
                key={admin._id}
                onClick={() => navigate(`/superadmin/admins/${admin._id}`)}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-ios hover:shadow-ios-lg active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-ios-blue/10 text-ios-blue flex items-center justify-center font-bold text-base flex-shrink-0">
                      {admin.organizationName?.charAt(0) || 'L'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {admin.organizationName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.name}</span>
                      </div>
                    </div>
                  </div>
                  <PulseBadge status={admin.status} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {admin.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleStatus(admin._id, admin.status, e)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors active:scale-95 ${
                        admin.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {admin.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

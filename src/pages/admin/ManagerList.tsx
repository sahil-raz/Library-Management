import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Shield, Trash2, Key, Building2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { IOSToggle } from '../../components/reactbits/IOSToggle.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';

export const ManagerList: React.FC = () => {
  const { showToast } = useToast();
  const [managers, setManagers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    branchId: '',
  });

  // Permissions Modal
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [perms, setPerms] = useState<any>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, bRes] = await Promise.all([
        api.get<{ success: boolean; managers: any[] }>('/admin/managers'),
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
      ]);
      if (mRes.success) setManagers(mRes.managers);
      if (bRes.success) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0) {
          setFormData((prev) => ({ ...prev, branchId: bRes.branches[0]._id }));
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load managers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId) {
      showToast('Please select an assigned branch', 'error');
      return;
    }

    try {
      await api.post('/admin/managers', formData);
      showToast('Staff manager created with default permissions!', 'success');
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', branchId: branches[0]?._id || '' });
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create manager', 'error');
    }
  };

  const openPermissionsModal = (manager: any) => {
    setSelectedManager(manager);
    setPerms(manager.permissions || {
      users_view: true,
      users_create: false,
      users_edit: false,
      seats_view: true,
      seats_assign: false,
      queue_manage: false,
      entries_manage: false,
      payments_view: false,
      expenses_manage: false,
      expenses_add: false,
      expenses_view: true,
      reminders_send: false,
      dashboard_view: true,
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedManager) return;
    try {
      setIsSavingPerms(true);
      await api.patch(`/admin/managers/${selectedManager._id}/permissions`, perms);
      showToast('Custom manager permissions saved', 'success');
      setSelectedManager(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update permissions', 'error');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('Are you sure you want to remove this manager?')) return;
    try {
      await api.delete(`/admin/managers/${managerId}`);
      showToast('Manager removed', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete manager', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Staff Managers"
        subtitle="Branch-Scoped Operators"
        rightAction={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Add Staff Manager"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading staff...</div>
        ) : managers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Managers Added</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add branch operators with granular custom permissions.
            </p>
            <ShimmerButton onClick={() => setIsCreateOpen(true)} size="md">
              Add First Manager
            </ShimmerButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {managers.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
                      <span className="text-xs text-slate-500 block">{m.email}</span>
                      <span className="text-[11px] font-semibold text-ios-blue mt-0.5 block">
                        Assigned: {m.branchId?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <PulseBadge status={m.status} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => openPermissionsModal(m)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold active:scale-95 transition-all"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" /> Custom Permissions
                  </button>
                  <button
                    onClick={() => handleDeleteManager(m._id)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Manager BottomSheet */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Staff Manager"
      >
        <form onSubmit={handleCreateManager} className="flex flex-col gap-3.5">
          <Input
            label="Manager Full Name"
            placeholder="e.g. Amit Verma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="amit@library.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Input
            label="Login Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Assigned Branch (Strict Scope)</label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              required
            >
              {branches.length === 0 && <option value="">No branches created yet</option>}
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.address})
                </option>
              ))}
            </select>
          </div>

          <ShimmerButton type="submit" size="lg" className="w-full mt-2">
            Create Manager
          </ShimmerButton>
        </form>
      </BottomSheet>

      {/* Permissions BottomSheet */}
      <BottomSheet
        isOpen={!!selectedManager}
        onClose={() => setSelectedManager(null)}
        title={`Permissions: ${selectedManager?.name}`}
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 mb-1">
            Toggle granular permissions for this manager at branch{' '}
            <strong className="text-slate-800">{selectedManager?.branchId?.name}</strong>:
          </p>

          <div className="divide-y divide-slate-100 bg-slate-50/60 p-3 rounded-2xl border border-slate-200">
            <IOSToggle
              label="View Branch Dashboard"
              description="Access branch statistics and overview"
              checked={perms.dashboard_view ?? true}
              onChange={(checked) => setPerms({ ...perms, dashboard_view: checked })}
            />
            <IOSToggle
              label="View Users / Patrons"
              description="View patrons enrolled in this branch"
              checked={perms.users_view ?? true}
              onChange={(checked) => setPerms({ ...perms, users_view: checked })}
            />
            <IOSToggle
              label="Create Users"
              description="Register new patrons on-site"
              checked={perms.users_create ?? false}
              onChange={(checked) => setPerms({ ...perms, users_create: checked })}
            />
            <IOSToggle
              label="View Seats"
              description="View seat layout and occupancy"
              checked={perms.seats_view ?? true}
              onChange={(checked) => setPerms({ ...perms, seats_view: checked })}
            />
            <IOSToggle
              label="Assign & Release Seats"
              description="Allocate study desks to students"
              checked={perms.seats_assign ?? false}
              onChange={(checked) => setPerms({ ...perms, seats_assign: checked })}
            />
            <IOSToggle
              label="Manage Waiting Queue"
              description="Add and manage queue entries"
              checked={perms.queue_manage ?? false}
              onChange={(checked) => setPerms({ ...perms, queue_manage: checked })}
            />
            <IOSToggle
              label="Manage Entries / Entry Status"
              description="Promote queued patrons to active entry"
              checked={perms.entries_manage ?? false}
              onChange={(checked) => setPerms({ ...perms, entries_manage: checked })}
            />
            <IOSToggle
              label="View Branch Expenses"
              description="Inspect utility and maintenance logs"
              checked={perms.expenses_view ?? true}
              onChange={(checked) => setPerms({ ...perms, expenses_view: checked })}
            />
            <IOSToggle
              label="Add Branch Expenses"
              description="Record electricity, water, and internet bills"
              checked={perms.expenses_add ?? false}
              onChange={(checked) => setPerms({ ...perms, expenses_add: checked })}
            />
            <IOSToggle
              label="Send WhatsApp Reminders"
              description="Trigger dynamic renewal reminders"
              checked={perms.reminders_send ?? false}
              onChange={(checked) => setPerms({ ...perms, reminders_send: checked })}
            />
          </div>

          <ShimmerButton
            onClick={handleSavePermissions}
            size="lg"
            isLoading={isSavingPerms}
            className="w-full mt-2"
          >
            Save Permissions
          </ShimmerButton>
        </div>
      </BottomSheet>
    </div>
  );
};

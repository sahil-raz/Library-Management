import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Send, Phone, Armchair, Building, MoreVertical, CheckCircle, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';

export const UserList: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    branchId: '',
  });

  // Entry Status BottomSheet
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('entryStatus', statusFilter);

      const [uRes, bRes] = await Promise.all([
        api.get<{ success: boolean; users: any[] }>(`/admin/users?${params}`),
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
      ]);

      if (uRes.success) setUsers(uRes.users);
      if (bRes.success) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0 && !newUser.branchId) {
          setNewUser((prev) => ({ ...prev, branchId: bRes.branches[0]._id }));
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      showToast('Student registered successfully!', 'success');
      setIsCreateOpen(false);
      setNewUser({ name: '', email: '', phone: '', whatsappNumber: '', password: '', branchId: branches[0]?._id || '' });
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to register student (Plan limit reached?)', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedUserForStatus) return;
    try {
      await api.patch(`/admin/users/${selectedUserForStatus._id}/entry-status`, { entryStatus: newStatus });
      showToast(`Entry status set to ${newStatus}`, 'success');
      setSelectedUserForStatus(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSendWhatsApp = (user: any) => {
    let phone = user.whatsappNumber || user.phone;
    phone = phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const message = encodeURIComponent(
      `Hello ${user.name}, this is a notification regarding your library membership and study seat.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Students & Patrons"
        subtitle="Manage Library Members"
        showBack
        rightAction={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Add Student"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="QUEUE">QUEUE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="NONE">NONE</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading students...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Register students manually or share the public registration link.
            </p>
            <ShimmerButton onClick={() => setIsCreateOpen(true)} size="md">
              Register Student
            </ShimmerButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div
                key={u._id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{u.name}</h3>
                    <span className="text-xs text-slate-500 block mt-0.5">{u.phone}</span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => setSelectedUserForStatus(u)}>
                      <PulseBadge
                        status={u.entryStatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}
                        label={u.entryStatus}
                        size="sm"
                      />
                    </button>
                    {u.currentSeat && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-50 text-ios-blue">
                        <Armchair className="w-3 h-3" /> {u.currentSeat.seatNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Branch: {u.branchId?.name || 'General'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendWhatsApp(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 active:scale-95 transition-all"
                    >
                      <Send className="w-3 h-3" /> WhatsApp
                    </button>
                    <button
                      onClick={() => setSelectedUserForStatus(u)}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                      title="Update Entry Status"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Student BottomSheet */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Student"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
          <Input
            label="Full Name"
            placeholder="e.g. Priyanshu Sharma"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="priyanshu@gmail.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Phone"
              type="tel"
              placeholder="9876543210"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              required
            />
            <Input
              label="WhatsApp"
              type="tel"
              placeholder="9876543210"
              value={newUser.whatsappNumber}
              onChange={(e) => setNewUser({ ...newUser, whatsappNumber: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Assign Branch</label>
            <select
              value={newUser.branchId}
              onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              required
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Initial Password"
            type="password"
            placeholder="••••••••"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />

          <ShimmerButton type="submit" size="lg" className="w-full mt-2">
            Register Student
          </ShimmerButton>
        </form>
      </BottomSheet>

      {/* Entry Status Update Modal */}
      <BottomSheet
        isOpen={!!selectedUserForStatus}
        onClose={() => setSelectedUserForStatus(null)}
        title={`Status: ${selectedUserForStatus?.name}`}
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 mb-2">
            Select the library entry & queue status for this student:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {['ACTIVE', 'QUEUE', 'EXPIRED', 'SUSPENDED', 'NONE'].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`py-3 px-4 rounded-2xl border font-bold text-xs active:scale-95 transition-all text-center ${
                  selectedUserForStatus?.entryStatus === st
                    ? 'bg-ios-blue text-white border-ios-blue shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

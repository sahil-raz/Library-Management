import React, { useEffect, useState } from 'react';
import { Users, Plus, Phone, Armchair, Send } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ManagerPermissionSet } from '../../types/index.js';

export const ManagerUsers: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const perms = (user?.permissions || {}) as Partial<ManagerPermissionSet>;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; users: any[] }>('/manager/users');
      if (res.success) setUsers(res.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to load branch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/manager/users', newUser);
      showToast('Student registered successfully', 'success');
      setIsCreateOpen(false);
      setNewUser({ name: '', email: '', phone: '', whatsappNumber: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to register student', 'error');
    }
  };

  const handleSendWhatsApp = (u: any) => {
    let phone = u.whatsappNumber || u.phone;
    phone = phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const message = encodeURIComponent(`Hello ${u.name}, greeting from your study library.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Branch Students"
        subtitle="Enrolled Patrons"
        showBack
        rightAction={
          perms.users_create ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
              title="Add Student"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : null
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading branch students...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Students in This Branch</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Students allocated here will be displayed.</p>
            {perms.users_create && (
              <ShimmerButton onClick={() => setIsCreateOpen(true)} size="md">
                Register Student
              </ShimmerButton>
            )}
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
                    <PulseBadge
                      status={u.entryStatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}
                      label={u.entryStatus}
                      size="sm"
                    />
                    {u.currentSeat && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-50 text-ios-blue">
                        <Armchair className="w-3 h-3" /> {u.currentSeat.seatNumber}
                      </span>
                    )}
                  </div>
                </div>

                {perms.reminders_send && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleSendWhatsApp(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 active:scale-95 transition-all"
                    >
                      <Send className="w-3 h-3" /> WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {perms.users_create && (
        <BottomSheet
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Register Student"
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
              placeholder="student@example.com"
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
            <Input
              label="Password"
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
      )}
    </div>
  );
};

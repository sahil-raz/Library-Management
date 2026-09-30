import React, { useEffect, useState } from 'react';
import { Clock, Plus, ArrowUpRight } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ManagerPermissionSet } from '../../types/index.js';

export const ManagerQueue: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const perms = (user?.permissions || {}) as Partial<ManagerPermissionSet>;

  const [queue, setQueue] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, uRes] = await Promise.all([
        api.get<{ success: boolean; queue: any[] }>('/manager/queue'),
        api.get<{ success: boolean; users: any[] }>('/manager/users'),
      ]);

      if (qRes.success) setQueue(qRes.queue);
      if (uRes.success) {
        setUsers(uRes.users);
        if (uRes.users.length > 0) setSelectedUserId(uRes.users[0]._id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load branch queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/manager/queue', {
        userId: selectedUserId,
        priority: Number(priority),
        notes,
      });
      showToast('Student added to queue', 'success');
      setIsAddOpen(false);
      setNotes('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add to queue', 'error');
    }
  };

  const handlePromote = async (queueId: string) => {
    try {
      await api.post(`/manager/queue/${queueId}/promote`);
      showToast('Student promoted to ACTIVE status', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to promote', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Branch Queue"
        subtitle="Walk-ins & Waitlist"
        showBack
        rightAction={
          perms.queue_manage ? (
            <button
              onClick={() => setIsAddOpen(true)}
              className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : null
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Waiting Queue Empty</h3>
            <p className="text-xs text-slate-400 mt-1">No students in line at this branch.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((item, index) => (
              <div
                key={item._id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.userId?.name}</h4>
                    <span className="text-xs text-slate-500 block">{item.userId?.phone}</span>
                  </div>
                </div>

                {perms.entries_manage && (
                  <button
                    onClick={() => handlePromote(item._id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-ios-green text-white font-bold text-xs shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Promote
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {perms.queue_manage && (
        <BottomSheet
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add to Waiting Queue"
        >
          <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">Select Student</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
                required
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.phone})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />

            <Input
              label="Notes"
              placeholder="e.g. Waiting for window seat"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <ShimmerButton type="submit" size="lg" className="w-full mt-2">
              Add to Queue
            </ShimmerButton>
          </form>
        </BottomSheet>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Clock, Plus, ArrowUpRight, Trash2, User, Building2, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useToast } from '../../context/ToastContext.js';

export const QueueManagement: React.FC = () => {
  const { showToast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, bRes, uRes] = await Promise.all([
        api.get<{ success: boolean; queue: any[] }>('/admin/queue'),
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
        api.get<{ success: boolean; users: any[] }>('/admin/users'),
      ]);

      if (qRes.success && Array.isArray(qRes.queue)) {
        setQueue(qRes.queue);
      }
      if (bRes.success && Array.isArray(bRes.branches)) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0) {
          setSelectedBranchId((prev) => prev || bRes.branches[0]._id);
        }
      }
      if (uRes.success && Array.isArray(uRes.users)) {
        setUsers(uRes.users);
        if (uRes.users.length > 0) {
          setSelectedUserId((prev) => prev || uRes.users[0]._id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !selectedUserId) {
      showToast('Select branch and student', 'error');
      return;
    }

    try {
      await api.post('/admin/queue', {
        branchId: selectedBranchId,
        userId: selectedUserId,
        priority: Number(priority),
        notes,
      });
      showToast('Student added to waiting queue', 'success');
      setIsAddModalOpen(false);
      setNotes('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add to queue (Plan limit reached?)', 'error');
    }
  };

  const handlePromote = async (queueId: string) => {
    try {
      await api.post(`/admin/queue/${queueId}/promote`);
      showToast('Student promoted to ACTIVE status!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Promotion failed', 'error');
    }
  };

  const handleRemove = async (queueId: string) => {
    if (!confirm('Remove student from waiting queue?')) return;
    try {
      await api.delete(`/admin/queue/${queueId}`);
      showToast('Removed from queue', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Waiting Queue"
        subtitle="Direct Entry & Waitlist System"
        showBack
        rightAction={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Add to Queue"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Waiting Queue is Empty</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add walk-in patrons or pending applicants to manage seat rotation.
            </p>
            <ShimmerButton onClick={() => setIsAddModalOpen(true)} size="md">
              Add to Queue
            </ShimmerButton>
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
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {item.userId?.name}
                    </h4>
                    <span className="text-xs text-slate-500 block">{item.userId?.phone}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.branchId?.name} • Priority: {item.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handlePromote(item._id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-ios-green text-white font-bold text-xs shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Promote
                  </button>
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add To Queue Modal */}
      <BottomSheet
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Student to Waiting Queue"
      >
        <form onSubmit={handleAddToQueue} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Select Student</label>
            {users.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-700 font-medium">
                No students registered yet. Students must register first before joining the waitlist.
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
                required
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.phone})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Branch</label>
            {branches.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-700 font-medium">
                No branches created yet. Please create a branch first.
              </div>
            ) : (
              <select
                value={selectedBranchId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBranchId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
                required
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="Priority (Higher = Prioritized in line)"
            type="number"
            value={priority}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriority(Number(e.target.value))}
          />

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Waiting for AC cabin slot"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          />

          <ShimmerButton
            type="submit"
            size="lg"
            disabled={users.length === 0 || branches.length === 0}
            className="w-full mt-2"
          >
            Add to Waitlist
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Armchair, Calendar } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ManagerPermissionSet } from '../../types/index.js';

export const ManagerSeats: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const perms = (user?.permissions || {}) as Partial<ManagerPermissionSet>;

  const [seats, setSeats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign Seat Modal
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, uRes] = await Promise.all([
        api.get<{ success: boolean; seats: any[] }>('/manager/seats'),
        api.get<{ success: boolean; users: any[] }>('/manager/users'),
      ]);

      if (sRes.success) setSeats(sRes.seats);
      if (uRes.success) {
        setUsers(uRes.users);
        if (uRes.users.length > 0) setAssignUserId(uRes.users[0]._id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load branch seats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget || !assignUserId) return;

    try {
      setIsAssigning(true);
      await api.post('/manager/seats/assign', {
        seatId: assignTarget._id,
        userId: assignUserId,
        startDate,
        endDate,
        notes,
      });
      showToast(`Seat ${assignTarget.seatNumber} assigned successfully!`, 'success');
      setAssignTarget(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Seat assignment failed', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="Branch Seats" subtitle="Desk Occupancy & Allocation" showBack />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading seats...</div>
        ) : seats.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Armchair className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Seats in This Branch</h3>
            <p className="text-xs text-slate-400 mt-1">Please ask your library admin to configure seats.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {seats.map((seat) => {
              const isAssigned = seat.status === 'ASSIGNED';
              return (
                <div
                  key={seat._id}
                  className={`p-3.5 rounded-3xl border shadow-sm flex flex-col justify-between ${
                    isAssigned ? 'bg-blue-50/70 border-blue-200/90' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-lg font-black text-slate-900">{seat.seatNumber}</h4>
                    <PulseBadge status={seat.status} size="sm" />
                  </div>

                  <div className="my-2 text-xs">
                    {isAssigned && seat.assignedUserId ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block truncate">
                          {seat.assignedUserId.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {seat.assignedUserId.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Available</span>
                    )}
                  </div>

                  {perms.seats_assign && !isAssigned && (
                    <button
                      onClick={() => setAssignTarget(seat)}
                      className="w-full py-1.5 px-2 rounded-xl bg-ios-blue text-white text-xs font-bold active:scale-95 shadow-sm transition-all"
                    >
                      Assign Desk
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {perms.seats_assign && (
        <BottomSheet
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          title={`Assign Seat ${assignTarget?.seatNumber}`}
        >
          <form onSubmit={handleAssignSeat} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">Select Student</label>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
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

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <Input
              label="Notes"
              placeholder="e.g. Assigned on-site"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <ShimmerButton type="submit" size="lg" isLoading={isAssigning} className="w-full mt-2">
              Confirm Assignment
            </ShimmerButton>
          </form>
        </BottomSheet>
      )}
    </div>
  );
};

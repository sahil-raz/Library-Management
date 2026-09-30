import React, { useEffect, useState } from 'react';
import { Armchair, Plus, User, Calendar, Trash2, CheckCircle2, UserMinus, Search, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';

export const SeatList: React.FC = () => {
  const { showToast } = useToast();
  const [seats, setSeats] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'ASSIGNED'>('ALL');

  // Create Seat Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [seatNumber, setSeatNumber] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');

  // Assign Seat Modal
  const [assignSeatTarget, setAssignSeatTarget] = useState<any>(null);
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
      const params = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
      const [sRes, bRes, uRes] = await Promise.all([
        api.get<{ success: boolean; seats: any[] }>(`/admin/seats${params}`),
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
        api.get<{ success: boolean; users: any[] }>('/admin/users'),
      ]);

      if (sRes.success) setSeats(sRes.seats);
      if (bRes.success) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0 && !targetBranchId) {
          setTargetBranchId(bRes.branches[0]._id);
        }
      }
      if (uRes.success) setUsers(uRes.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to load seats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const handleCreateSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranchId || !seatNumber.trim()) {
      showToast('Branch and Seat Number are required', 'error');
      return;
    }

    try {
      await api.post('/admin/seats', {
        branchId: targetBranchId,
        seatNumber: seatNumber.trim().toUpperCase(),
      });
      showToast('Seat created successfully!', 'success');
      setIsCreateOpen(false);
      setSeatNumber('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create seat (Plan limit reached?)', 'error');
    }
  };

  const handleAssignSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSeatTarget || !assignUserId) {
      showToast('Please select a student/patron', 'error');
      return;
    }

    try {
      setIsAssigning(true);
      await api.post('/admin/seats/assign', {
        seatId: assignSeatTarget._id,
        userId: assignUserId,
        startDate,
        endDate,
        notes,
      });
      showToast(`Seat ${assignSeatTarget.seatNumber} assigned!`, 'success');
      setAssignSeatTarget(null);
      setAssignUserId('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignSeat = async (seatId: string) => {
    if (!confirm('Release this seat? The student will no longer have this seat reserved.')) return;
    try {
      await api.post(`/admin/seats/${seatId}/unassign`);
      showToast('Seat released', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to release seat', 'error');
    }
  };

  const handleDeleteSeat = async (seatId: string) => {
    if (!confirm('Delete this seat?')) return;
    try {
      await api.delete(`/admin/seats/${seatId}`);
      showToast('Seat deleted', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete seat', 'error');
    }
  };

  const filteredSeats = seats.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const matchNumber = s.seatNumber?.toLowerCase().includes(q);
    const student = s.assignedUserId;
    const matchStudentName = student?.name?.toLowerCase().includes(q);
    const matchStudentEmail = student?.email?.toLowerCase().includes(q);
    const matchStudentPhone = student?.phone?.toLowerCase().includes(q);
    return matchNumber || matchStudentName || matchStudentEmail || matchStudentPhone;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Seat Management"
        subtitle="Desks, Reservations & Occupancy"
        showBack
        rightAction={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Add Seat"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search seat number, student name or email..."
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

        {/* Status Filter Pills & Branch Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['ALL', 'AVAILABLE', 'ASSIGNED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'All Seats' : st === 'AVAILABLE' ? 'Available' : 'Occupied'}
                <span className="ml-1 text-[10px] opacity-70">
                  (
                  {st === 'ALL'
                    ? seats.length
                    : seats.filter((s) => s.status === st).length}
                  )
                </span>
              </button>
            ))}
          </div>

          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Visual Seat Grid */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading seats...</div>
        ) : seats.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Armchair className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Seats Configured</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Create seats up to your subscription plan limit.
            </p>
            <ShimmerButton onClick={() => setIsCreateOpen(true)} size="md">
              Add First Seat
            </ShimmerButton>
          </div>
        ) : filteredSeats.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No matching seats found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              No seat matches "{search}". Try searching another seat number or student.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredSeats.map((seat) => {
              const isAssigned = seat.status === 'ASSIGNED';
              return (
                <div
                  key={seat._id}
                  className={`p-3.5 rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
                    isAssigned
                      ? 'bg-blue-50/70 border-blue-200/90'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">
                        {seat.branchId?.name}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">
                        {seat.seatNumber}
                      </h4>
                    </div>
                    <PulseBadge status={seat.status} size="sm" />
                  </div>

                  <div className="my-2 text-xs">
                    {isAssigned && seat.assignedUserId ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 truncate block">
                          {seat.assignedUserId.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {seat.assignedUserId.phone}
                        </span>
                        {seat.assignedUntil && (
                          <span className="text-[10px] text-slate-400 block">
                            Until {new Date(seat.assignedUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Available to allocate</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                    {isAssigned ? (
                      <button
                        onClick={() => handleUnassignSeat(seat._id)}
                        className="flex-1 py-1 px-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-bold active:scale-95 transition-all text-center"
                      >
                        Release
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setAssignSeatTarget(seat);
                          if (users.length > 0) setAssignUserId(users[0]._id);
                        }}
                        className="flex-1 py-1 px-2 rounded-xl bg-ios-blue text-white text-[11px] font-bold active:scale-95 shadow-sm transition-all text-center"
                      >
                        Assign
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSeat(seat._id)}
                      className="p-1 rounded-xl text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Seat BottomSheet */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Study Desk / Seat"
      >
        <form onSubmit={handleCreateSeat} className="flex flex-col gap-3.5">
          <Input
            label="Seat / Desk Number"
            placeholder="e.g. A01, B12, CABIN-4"
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Branch</label>
            <select
              value={targetBranchId}
              onChange={(e) => setTargetBranchId(e.target.value)}
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

          <ShimmerButton type="submit" size="lg" className="w-full mt-2">
            Create Seat
          </ShimmerButton>
        </form>
      </BottomSheet>

      {/* Assign Seat BottomSheet */}
      <BottomSheet
        isOpen={!!assignSeatTarget}
        onClose={() => setAssignSeatTarget(null)}
        title={`Assign Seat: ${assignSeatTarget?.seatNumber}`}
      >
        <form onSubmit={handleAssignSeat} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Select Student / Member</label>
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              required
            >
              {users.length === 0 && <option value="">No patrons found</option>}
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
              label="End Date (Auto-Expiry)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Internal Notes (Optional)"
            placeholder="e.g. Morning shift slot"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <ShimmerButton type="submit" size="lg" isLoading={isAssigning} className="w-full mt-2">
            Confirm Seat Assignment
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Armchair, Plus, User, Clock, Trash2, Search, X, Calendar, Layers, ChevronRight } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { useToast } from '../../context/ToastContext.js';
import { BatchOccupancyModal } from '../../components/admin/BatchOccupancyModal.js';
import { BatchManagerModal } from '../../components/admin/BatchManagerModal.js';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal.js';
import { IDCardModal } from '../../components/common/IDCardModal.js';
import { RenewPlanModal } from '../../components/admin/RenewPlanModal.js';
import { SendWhatsAppModal } from '../../components/admin/SendWhatsAppModal.js';

export const SeatList: React.FC = () => {
  const { showToast } = useToast();
  const [seats, setSeats] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Seat Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [seatNumber, setSeatNumber] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');

  // Timing Batches Management Modal
  const [isBatchManagerOpen, setIsBatchManagerOpen] = useState(false);

  // Linking Modals
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [idCardData, setIdCardData] = useState<any>(null);
  const [studentToRenew, setStudentToRenew] = useState<any>(null);
  const [studentToSendWhatsApp, setStudentToSendWhatsApp] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
      const [sRes, bRes, batchRes] = await Promise.all([
        api.get<{ success: boolean; seats: any[] }>(`/admin/seats${params}`),
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
        api.get<{ success: boolean; batches: any[] }>('/admin/batches'),
      ]);

      if (sRes.success) setSeats(sRes.seats);
      if (bRes.success) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0 && !targetBranchId) {
          setTargetBranchId(bRes.branches[0]._id);
        }
      }
      if (batchRes.success) setBatches(batchRes.batches);
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

  const handleDeleteSeat = async (seatId: string) => {
    if (!confirm('Delete this seat?')) return;
    try {
      await api.delete(`/admin/seats/${seatId}`);
      showToast('Seat deleted', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete seat (Active assignments exist)', 'error');
    }
  };

  const handleOpenIdCard = async (student: any) => {
    try {
      const res = await api.get<{ success: boolean; idCard: any }>(`/admin/users/${student._id}/id-card`);
      if (res.success) setIdCardData(res.idCard);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSeats = seats.filter((s) => {
    if (selectedBatchFilter) {
      const hasBatch = s.activeAssignments?.some(
        (a: any) => (a.batchId?._id || a.batchId) === selectedBatchFilter
      );
      if (!hasBatch) return false;
    }
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const matchNumber = s.seatNumber?.toLowerCase().includes(q);
    const matchStudent = s.activeAssignments?.some((a: any) =>
      a.userId?.name?.toLowerCase().includes(q) || a.userId?.phone?.includes(q)
    );
    return matchNumber || matchStudent;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-12 min-h-screen">
      <Header
        title="Seat Management"
        subtitle="Batch-Wise Timings & Desk Allocation"
        showBack
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchManagerOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              title="Manage Session Batches"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Session Batches</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
              title="Add Desk / Seat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="p-4 flex flex-col gap-3.5">
        {/* Branch Filter & Batch Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {batches.length > 0 && (
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="">All Session Timings</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.startTime} - {b.endTime})
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search desk number or student..."
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
        </div>

        {/* Informational Guidance */}
        <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-ios-blue flex-shrink-0" />
            <span>
              Click any seat to view its <strong>occupants across all session timing batches</strong>.
            </span>
          </div>
        </div>

        {/* Seat Grid */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-12">Loading desks and batches...</div>
        ) : filteredSeats.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 mt-2">
            <Armchair className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Desks Configured</h3>
            <p className="text-xs text-slate-400 mt-1 mb-3">Add desks to start allocating students in session batches.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-ios-blue text-white rounded-xl text-xs font-bold"
            >
              Add Desk #01
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredSeats.map((seat) => {
              const activeCount = seat.activeAssignments?.length || 0;
              const hasAssignments = activeCount > 0;

              return (
                <div
                  key={seat._id}
                  onClick={() => setSelectedSeatId(seat._id)}
                  className="p-3.5 rounded-3xl bg-white border border-slate-200 hover:border-ios-blue/60 shadow-ios hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between text-left"
                >
                  <div>
                    {/* Seat Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs">
                        {seat.seatNumber}
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          hasAssignments
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {hasAssignments ? `${activeCount} BATCH` : 'VACANT'}
                      </span>
                    </div>

                    {/* Desk Details */}
                    <span className="text-sm font-bold text-slate-900 block">
                      Desk {seat.seatNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">
                      {seat.branchId?.name}
                    </span>

                    {/* Occupants Snapshot across batches */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                      {hasAssignments ? (
                        seat.activeAssignments.map((assign: any, i: number) => (
                          <div
                            key={i}
                            className="text-[10px] text-slate-600 flex items-center justify-between truncate"
                          >
                            <span className="font-semibold text-slate-700 truncate max-w-[90px]">
                              {assign.batchId?.name || 'Shift'}
                            </span>
                            <span className="text-ios-blue font-bold truncate max-w-[80px]">
                              {assign.userId?.name?.split(' ')[0]}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          Free in all shifts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-ios-blue font-semibold">
                    <span>View Schedule</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Desk Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add New Desk / Seat</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeat} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 font-bold text-xs mb-1">Branch</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-ios-blue/30 outline-none"
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
                label="Seat / Desk Number"
                placeholder="e.g. 01, A-12, or Desk-4"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                required
              />

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  Create Desk
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Linked Modals */}
      <BatchManagerModal
        isOpen={isBatchManagerOpen}
        onClose={() => setIsBatchManagerOpen(false)}
        onBatchesUpdated={fetchData}
      />

      <BatchOccupancyModal
        isOpen={!!selectedSeatId}
        seatId={selectedSeatId}
        onClose={() => setSelectedSeatId(null)}
        onSelectStudent={(student) => setSelectedStudent(student)}
      />

      <StudentDetailModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onGenerateIdCard={(student) => handleOpenIdCard(student)}
        onRenewPlan={(student) => setStudentToRenew(student)}
        onSendWhatsApp={(student) => setStudentToSendWhatsApp(student)}
      />

      <IDCardModal
        isOpen={!!idCardData}
        idCardData={idCardData}
        onClose={() => setIdCardData(null)}
      />

      <RenewPlanModal
        isOpen={!!studentToRenew}
        student={studentToRenew}
        onClose={() => setStudentToRenew(null)}
        onSuccess={fetchData}
      />

      <SendWhatsAppModal
        isOpen={!!studentToSendWhatsApp}
        student={studentToSendWhatsApp}
        onClose={() => setStudentToSendWhatsApp(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};

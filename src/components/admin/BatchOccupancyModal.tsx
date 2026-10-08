import React, { useEffect, useState } from 'react';
import { X, Armchair, Clock, User, ChevronRight, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../../api/client.js';

interface BatchOccupancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  seatId: string | null;
  onSelectStudent: (student: any) => void;
  onAssignStudentToBatch?: (batchId: string, seatId: string) => void;
}

export const BatchOccupancyModal: React.FC<BatchOccupancyModalProps> = ({
  isOpen,
  onClose,
  seatId,
  onSelectStudent,
  onAssignStudentToBatch,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !seatId) return;

    setLoading(true);
    api
      .get<{ success: boolean; seat: any; batches: any[] }>(`/admin/seats/${seatId}/details`)
      .then((res) => {
        if (res.success) {
          setData(res);
        }
      })
      .catch((err) => console.error('Failed to fetch seat details:', err))
      .finally(() => setLoading(false));
  }, [isOpen, seatId]);

  if (!isOpen || !seatId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Seat {data?.seat?.seatNumber ? `Desk ${data.seat.seatNumber}` : 'Occupancy Schedule'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {data?.seat?.branchId?.name || 'Library Branch'} • Timing-wise occupancy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading batch allocations...</div>
          ) : !data?.batches || data.batches.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No Batches Configured</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Please add Session Batches (e.g. Morning 8am-1pm, Evening 2pm-6pm) in Batches settings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 px-1 flex items-center justify-between">
                <span>BATCH TIMINGS ({data.batches.length})</span>
                <span>Click student to view details</span>
              </div>

              {data.batches.map((item: any) => {
                const { batch, isOccupied, student, assignment } = item;
                const now = new Date();
                const expiry = student?.planEndDate ? new Date(student.planEndDate) : null;
                const isExpired = expiry && expiry < now;

                return (
                  <div
                    key={batch._id}
                    className={`rounded-2xl border transition-all p-3.5 ${
                      isOccupied
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-emerald-50/40 border-emerald-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-900">{batch.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          {batch.startTime} - {batch.endTime}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isOccupied
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOccupied ? 'OCCUPIED' : 'VACANT'}
                      </span>
                    </div>

                    {isOccupied && student ? (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectStudent(student);
                        }}
                        className="w-full mt-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between group transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {student.photo ? (
                              <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-ios-blue">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {student.phone} {student.classCourse ? `• ${student.classCourse}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isExpired ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-ios-blue'
                            }`}
                          >
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 pt-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Available for allocation
                        </span>
                        {onAssignStudentToBatch && (
                          <button
                            onClick={() => {
                              onClose();
                              onAssignStudentToBatch(batch._id, data.seat._id);
                            }}
                            className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all"
                          >
                            Assign Student
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

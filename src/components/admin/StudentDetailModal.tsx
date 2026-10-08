import React from 'react';
import { X, User, Phone, MapPin, Calendar, CreditCard, Armchair, Clock, ShieldCheck, Printer, RefreshCw, MessageSquare } from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onRenewPlan?: (student: any) => void;
  onGenerateIdCard?: (student: any) => void;
  onSendWhatsApp?: (student: any) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onRenewPlan,
  onGenerateIdCard,
  onSendWhatsApp,
}) => {
  if (!isOpen || !student) return null;

  const expiry = student.planEndDate ? new Date(student.planEndDate) : null;
  const now = new Date();
  const daysRemaining = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = (expiry && expiry < now) || student.entryStatus === 'EXPIRED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-ios-blue text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Profile</h3>
              <p className="text-[11px] text-slate-500">ID: {student.idCardNumber || student._id?.slice(-6)}</p>
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
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Top Banner with Photo & Name */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
              {student.photo ? (
                <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 truncate">{student.name}</h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isExpired
                      ? 'bg-rose-100 text-rose-700'
                      : daysRemaining <= 5
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isExpired ? 'EXPIRED' : `${daysRemaining}d left`}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-medium">{student.phone}</p>
              {student.classCourse && (
                <p className="text-ios-blue text-[11px] font-bold mt-0.5">{student.classCourse}</p>
              )}
            </div>
          </div>

          {/* Seat & Batch Timing Allocation */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
              <div className="flex items-center gap-1.5 text-purple-700 mb-1">
                <Armchair className="w-4 h-4" />
                <span className="font-bold text-[10px] uppercase">Assigned Seat</span>
              </div>
              <span className="text-sm font-black text-slate-900">
                {student.currentSeat?.seatNumber ? `Desk ${student.currentSeat.seatNumber}` : 'Unassigned'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center gap-1.5 text-amber-700 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-bold text-[10px] uppercase">Session Batch</span>
              </div>
              <span className="text-xs font-bold text-slate-900 line-clamp-1">
                {student.batchId?.name || 'Full Day'}
              </span>
              {student.batchId?.startTime && (
                <span className="text-[10px] text-slate-500 block">
                  {student.batchId.startTime} - {student.batchId.endTime}
                </span>
              )}
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Parent / Guardian:</span>
              <span className="font-bold text-slate-800">
                {student.parentName} ({student.parentPhone})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Gender & DOB:</span>
              <span className="font-medium text-slate-800">
                {student.gender || 'Male'} • {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {student.aadharNumber && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Aadhar Number:</span>
                <span className="font-mono font-medium text-slate-800">
                  {student.aadharNumber}
                </span>
              </div>
            )}
            {student.address && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Address:</span>
                <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">
                  {student.address}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Library Plan:</span>
              <span className="font-bold text-ios-blue">
                {student.currentPlan?.name || 'Regular Study Plan'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Plan Validity:</span>
              <span className="font-bold text-slate-800">
                {student.planStartDate ? new Date(student.planStartDate).toLocaleDateString() : 'Start'} to{' '}
                <span className={isExpired ? 'text-rose-600' : 'text-emerald-700'}>
                  {expiry ? expiry.toLocaleDateString() : 'N/A'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2">
          {onRenewPlan && (
            <button
              onClick={() => {
                onClose();
                onRenewPlan(student);
              }}
              className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Plan</span>
            </button>
          )}

          {onGenerateIdCard && (
            <button
              onClick={() => {
                onClose();
                onGenerateIdCard(student);
              }}
              className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ID Card</span>
            </button>
          )}

          {onSendWhatsApp && (
            <button
              onClick={() => {
                onClose();
                onSendWhatsApp(student);
              }}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

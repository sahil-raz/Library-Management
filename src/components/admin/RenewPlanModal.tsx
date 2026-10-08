import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Layers, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.js';

interface RenewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess?: () => void;
}

export const RenewPlanModal: React.FC<RenewPlanModalProps> = ({ isOpen, onClose, student, onSuccess }) => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api
      .get<{ success: boolean; plans: any[] }>('/admin/plans')
      .then((res) => {
        if (res.success) {
          setPlans(res.plans);
          if (res.plans.length > 0) {
            // default to student's current plan if available or first plan
            const currId = student?.currentPlan?._id || student?.currentPlan;
            const match = res.plans.find((p) => p._id === currId);
            setSelectedPlanId(match ? match._id : res.plans[0]._id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const selectedPlan = plans.find((p) => p._id === selectedPlanId);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      showToast('Please select a plan to renew', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post<{ success: boolean; message: string }>(
        `/admin/users/${student._id}/renew-plan`,
        {
          planId: selectedPlanId,
          paymentMode,
          notes,
        }
      );

      showToast(res.message || 'Plan renewed successfully!', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to renew plan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-ios-blue text-white">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Renew Membership Plan</h3>
              <p className="text-[11px] text-slate-500">Student: {student.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRenew} className="p-5 space-y-4 text-xs">
          {/* Current Expiry Alert */}
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-blue-600 block font-semibold">CURRENT EXPIRY</span>
              <span className="font-bold text-xs">
                {student.planEndDate ? new Date(student.planEndDate).toLocaleDateString() : 'Expired / None'}
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white/80 px-2.5 py-1 rounded-xl shadow-xs">
              Seat #{student.currentSeat?.seatNumber || 'N/A'}
            </span>
          </div>

          {/* Select Plan */}
          <div>
            <label className="block text-slate-600 font-bold mb-1.5">Select Library Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-ios-blue/30 outline-none"
              required
            >
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.price} ({p.validity} {p.validityUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Plan Summary Card */}
          {selectedPlan && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">{selectedPlan.name}</span>
                <span className="text-[10px] text-slate-500">
                  Duration: {selectedPlan.validity} {selectedPlan.validityUnit}
                </span>
              </div>
              <span className="text-base font-black text-emerald-600">₹{selectedPlan.price}</span>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-slate-600 font-bold mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['CASH', 'UPI'].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    paymentMode === mode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
            💡 Renewing this plan will extend validity, automatically record <strong>₹{selectedPlan?.price || 0}</strong> in your library Income, and send a renewal alert to the student.
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !selectedPlanId}
              className="flex-1 py-2.5 px-4 rounded-xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing Renewal...' : `Confirm & Renew (₹${selectedPlan?.price || 0})`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

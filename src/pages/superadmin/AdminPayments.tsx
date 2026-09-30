import React, { useEffect, useState } from 'react';
import { CreditCard, Check, X, Eye, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SEO } from '../../components/common/SEO.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminPayments: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Review BottomSheet State
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<{ success: boolean; payments: any[] }>(`/superadmin/payments?${params}`);
      if (res.success) setPayments(res.payments);
    } catch (err: any) {
      showToast(err.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !reviewAction) return;

    try {
      setIsProcessing(true);
      const res = await api.post<{ success: boolean; message: string }>(
        `/superadmin/payments/${selectedPayment._id}/review`,
        {
          action: reviewAction,
          rejectionReason: reviewAction === 'REJECT' ? rejectionReason : undefined,
        }
      );

      if (res.success) {
        showToast(res.message, reviewAction === 'APPROVE' ? 'success' : 'info');
        setSelectedPayment(null);
        setReviewAction(null);
        setRejectionReason('');
        fetchPayments();
      }
    } catch (err: any) {
      showToast(err.message || 'Payment review failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <SEO
        title="Review Subscription Payments"
        description="Review, verify, and approve library plan purchases, UPI transaction references, and payment screenshots."
      />
      <Header title="Subscription Payments" subtitle="Review Organization Subscriptions" />

      <div className="p-4 flex flex-col gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl select-none">
          {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No {statusFilter.toLowerCase()} payments</h3>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === 'PENDING' ? 'All submitted payments have been reviewed!' : 'No records found'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => (
              <div
                key={p._id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {p.adminId?.organizationName || 'Library Organization'}
                    </h3>
                    <span className="text-xs text-slate-500 block">
                      Admin: {p.adminId?.name} ({p.adminId?.phone})
                    </span>
                    <span className="text-xs font-bold text-ios-blue mt-0.5 block">
                      Plan: {p.planName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">₹{p.amount}</span>
                    <div className="mt-1">
                      <PulseBadge status={p.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* UTR & Screenshot */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      UTR Reference Number
                    </span>
                    <span className="font-mono font-bold text-slate-800 tracking-wider">
                      {p.utr}
                    </span>
                  </div>
                  {p.screenshot && (
                    <a
                      href={p.screenshot}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-ios-blue text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Receipt
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Submitted: {new Date(p.submittedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>

                {p.status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedPayment(p);
                        setReviewAction('APPROVE');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-ios-green text-white font-bold text-xs shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
                    >
                      <Check className="w-4 h-4" /> Approve & Activate
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPayment(p);
                        setReviewAction('REJECT');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 active:scale-95 transition-all"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <BottomSheet
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title={reviewAction === 'APPROVE' ? 'Approve Subscription' : 'Reject Payment'}
      >
        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Organization:</span>
              <strong className="text-slate-800">{selectedPayment?.adminId?.organizationName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Plan:</span>
              <strong className="text-slate-800">{selectedPayment?.planName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <strong className="text-slate-900 text-sm">₹{selectedPayment?.amount}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UTR:</span>
              <strong className="text-slate-800 font-mono">{selectedPayment?.utr}</strong>
            </div>
          </div>

          {reviewAction === 'APPROVE' ? (
            <p className="text-xs text-slate-500">
              Approving this payment will immediately activate the subscription, apply plan limits,
              and grant the library admin full access.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Reason for Rejection</label>
              <textarea
                rows={3}
                placeholder="e.g. UTR reference not matching bank credits, or invalid amount."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>
          )}

          <ShimmerButton
            type="submit"
            variant={reviewAction === 'APPROVE' ? 'success' : 'danger'}
            size="lg"
            isLoading={isProcessing}
            className="w-full mt-2"
          >
            {reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

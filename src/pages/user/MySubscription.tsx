import React, { useEffect, useState } from 'react';
import { CreditCard, Copy, Check, Upload, QrCode, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';

export const MySubscription: React.FC = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, payRes] = await Promise.all([
        api.get<{ success: boolean; plans: any[]; paymentConfig: any }>('/user/plans'),
        api.get<{ success: boolean; payments: any[] }>('/user/payments'),
      ]);

      if (pRes.success) {
        setPlans(pRes.plans);
        setPaymentConfig(pRes.paymentConfig);
      }
      if (payRes.success) setMyPayments(payRes.payments);
    } catch (err: any) {
      showToast(err.message || 'Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyUpi = () => {
    if (!paymentConfig?.upiId) return;
    navigator.clipboard.writeText(paymentConfig.upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied', 'info');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.uploadFile(file);
      if (res.success) {
        setScreenshotUrl(res.url);
        showToast('Receipt attached', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || !selectedPlan) {
      showToast('Please enter the 12-digit UTR transaction ID', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/user/payments', {
        planId: selectedPlan._id,
        utr: utr.trim(),
        screenshot: screenshotUrl,
      });

      showToast('Payment submitted! Awaiting library verification.', 'success');
      setSelectedPlan(null);
      setUtr('');
      setScreenshotUrl('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Payment submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="Study Plans & Fees" subtitle="Subscribe & Renew" showBack />

      <div className="p-4 flex flex-col gap-4">
        {/* Plans Catalog */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Available Library Plans
          </span>

          {loading ? (
            <div className="text-center text-xs text-slate-400 py-6">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
              No plans published yet. Please ask your library admin.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {plans.map((pl) => (
                <div
                  key={pl._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-ios flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{pl.name}</h4>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-slate-900">₹{pl.price}</span>
                        <span className="text-xs font-semibold text-slate-400">
                          / {pl.validity} {pl.validityUnit}
                        </span>
                      </div>
                    </div>
                    <ShimmerButton onClick={() => setSelectedPlan(pl)} size="sm">
                      Subscribe
                    </ShimmerButton>
                  </div>

                  {pl.features?.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {pl.features.map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        {myPayments.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              My Payment History
            </span>
            <div className="flex flex-col gap-2">
              {myPayments.map((p) => (
                <div
                  key={p._id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{p.planName}</span>
                    <span className="text-[10px] text-slate-400">
                      UTR: <strong className="font-mono text-slate-700">{p.utr}</strong> •{' '}
                      {new Date(p.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">₹{p.amount}</span>
                    <div className="mt-0.5">
                      <PulseBadge status={p.status} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Sheet */}
      <BottomSheet
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title="Pay Library Fee"
      >
        <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Plan</span>
              <h4 className="text-sm font-bold text-slate-900">{selectedPlan?.name}</h4>
              <span className="text-xs text-slate-500">
                {selectedPlan?.validity} {selectedPlan?.validityUnit}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Due</span>
              <span className="text-xl font-black text-ios-blue">₹{selectedPlan?.price}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Library UPI ID
                </span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {paymentConfig?.upiId || 'library@upi'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 active:scale-95 shadow-sm"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUpi ? 'Copied' : 'Copy'}
              </button>
            </div>

            {paymentConfig?.qrCode && (
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl border border-slate-200">
                <img
                  src={paymentConfig.qrCode}
                  alt="Library QR Code"
                  className="w-40 h-40 object-contain rounded-xl"
                />
                <span className="text-[10px] font-semibold text-slate-400 mt-1">
                  Scan to pay via any UPI app
                </span>
              </div>
            )}

            {paymentConfig?.paymentInstructions && (
              <p className="text-xs text-slate-500 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                {paymentConfig.paymentInstructions}
              </p>
            )}
          </div>

          <Input
            label="12-digit UTR Transaction ID"
            placeholder="e.g. 427819384729"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Payment Screenshot (Optional)</label>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 transition-all">
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : screenshotUrl ? 'Receipt Attached ✓' : 'Upload Receipt'}
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <ShimmerButton type="submit" size="lg" isLoading={isSubmitting} className="w-full mt-2">
            Submit Payment
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

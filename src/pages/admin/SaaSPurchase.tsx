import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Upload, QrCode, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { useToast } from '../../context/ToastContext.js';

export const SaaSPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Purchase Modal State
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    api
      .get<{ success: boolean; plans: any[]; currentPlanId?: string; currentSubscription?: any; paymentConfig: any }>('/admin/saas-plans')
      .then((res) => {
        if (res.success) {
          setPlans(res.plans);
          setCurrentPlanId(res.currentPlanId || null);
          setCurrentSubscription(res.currentSubscription || null);
          setPaymentConfig(res.paymentConfig);
        }
      })
      .catch((err) => showToast(err.message || 'Failed to fetch subscription plans', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyUpi = () => {
    if (!paymentConfig?.upiId) return;
    navigator.clipboard.writeText(paymentConfig.upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied to clipboard!', 'info');
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
        showToast('Payment receipt uploaded', 'success');
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
      await api.post('/admin/saas-plans/purchase', {
        planId: selectedPlan._id,
        utr: utr.trim(),
        screenshot: screenshotUrl,
      });

      showToast('Payment submitted for Super Admin review!', 'success');
      setSelectedPlan(null);
      setUtr('');
      setScreenshotUrl('');
      navigate('/admin');
    } catch (err: any) {
      showToast(err.message || 'Payment submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="My SaaS Subscription"
        subtitle="Library Platform License & Tier Limits"
        showBack
      />

      <div className="p-4 flex flex-col gap-4">
        {currentSubscription && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-ios flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Current Active License
              </span>
              <h4 className="text-base font-extrabold">{currentSubscription.planName}</h4>
              <span className="text-[11px] text-emerald-100">
                Valid until: {new Date(currentSubscription.expiresAt).toLocaleDateString()}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold tracking-wide uppercase">
              ACTIVE
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border text-xs text-slate-400">
            No plans available at this moment.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan._id;
              return (
                <div
                  key={plan._id}
                  className={`p-5 rounded-3xl bg-white shadow-ios flex flex-col gap-3 relative overflow-hidden transition-all ${
                    isCurrent
                      ? 'border-2 border-emerald-500/80 shadow-emerald-500/10'
                      : 'border border-slate-200/90'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-extrabold px-3 py-0.5 rounded-bl-xl tracking-wider uppercase">
                      Current Plan
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">{plan.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                        <span className="text-xs font-semibold text-slate-400">
                          / {plan.validity} {plan.validityUnit}
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <button
                        disabled
                        className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200/80 cursor-not-allowed flex items-center gap-1.5 shadow-none select-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Current
                      </button>
                    ) : (
                      <ShimmerButton onClick={() => setSelectedPlan(plan)} size="sm">
                        {currentPlanId ? 'Switch Plan' : 'Select Plan'}
                      </ShimmerButton>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span>✓ {plan.maxBranches} Branches</span>
                    <span>✓ {plan.maxManagers} Staff Managers</span>
                    <span>✓ {plan.maxUsers} Students/Patrons</span>
                    <span>✓ {plan.maxSeats} Total Seats</span>
                    <span>✓ {plan.maxMessages} WhatsApp Alerts</span>
                    <span>✓ Queue Management</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Sheet */}
      <BottomSheet
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title="Complete UPI Payment"
      >
        <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Selected Plan</span>
              <h4 className="text-sm font-bold text-slate-900">{selectedPlan?.name}</h4>
              <span className="text-xs text-slate-500">
                Validity: {selectedPlan?.validity} {selectedPlan?.validityUnit}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Amount to Pay</span>
              <span className="text-xl font-black text-ios-blue">₹{selectedPlan?.price}</span>
            </div>
          </div>

          {/* UPI ID & QR Display */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pay to Official UPI ID
                </span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {paymentConfig?.upiId || 'libr@upi'}
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
                  alt="UPI QR Code"
                  className="w-40 h-40 object-contain rounded-xl"
                />
                <span className="text-[10px] font-semibold text-slate-400 mt-1">
                  Scan using Google Pay, PhonePe, or Paytm
                </span>
              </div>
            )}

            {paymentConfig?.paymentInstructions && (
              <p className="text-xs text-slate-500 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                {paymentConfig.paymentInstructions}
              </p>
            )}
          </div>

          {/* Submit UTR */}
          <Input
            label="UTR / UPI Transaction ID"
            placeholder="12-digit UTR reference number"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            required
          />

          {/* Screenshot Upload */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-700">Payment Screenshot (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 transition-all">
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : screenshotUrl ? 'Screenshot Attached ✓' : 'Upload Screenshot'}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          <ShimmerButton type="submit" size="lg" isLoading={isSubmitting} className="w-full mt-2">
            Submit Payment for Review
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

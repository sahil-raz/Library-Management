import React, { useEffect, useState } from 'react';
import { Save, QrCode, Upload, CreditCard } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();
  const [upiId, setUpiId] = useState('');
  const [paymentName, setPaymentName] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ success: boolean; config: any }>('/admin/payment-config')
      .then((res) => {
        if (res.success && res.config) {
          setUpiId(res.config.upiId || '');
          setPaymentName(res.config.paymentName || '');
          setPaymentInstructions(res.config.paymentInstructions || '');
          setQrCodeUrl(res.config.qrCode || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.uploadFile(file);
      if (res.success) {
        setQrCodeUrl(res.url);
        showToast('Library QR Code uploaded successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !paymentName) {
      showToast('UPI ID and Payment Name are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await api.put('/admin/payment-config', {
        upiId,
        paymentName,
        paymentInstructions,
        qrCode: qrCodeUrl,
      });
      showToast('Student payment gateway updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header title="Payment Gateway" subtitle="Student Fee Collection Setup" showBack />

      <div className="p-4 flex flex-col gap-4">
        <form onSubmit={handleSave} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-4">
          <Input
            label="Library UPI ID (For Student Fees)"
            placeholder="e.g. apexlibrary@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            required
          />

          <Input
            label="Payment Display Name / Account Name"
            placeholder="e.g. Apex Study Hall & Library"
            value={paymentName}
            onChange={(e) => setPaymentName(e.target.value)}
            required
          />

          {/* QR Code Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Library QR Code</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-cover" />
                ) : (
                  <QrCode className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Uploading...' : 'Upload QR Image'}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Students will scan this QR to pay monthly fees.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Instructions for Students</label>
            <textarea
              rows={3}
              placeholder="e.g. Scan QR, pay fee, and enter your 12-digit UTR number."
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
            />
          </div>

          <ShimmerButton type="submit" size="lg" isLoading={isSaving} className="w-full mt-2">
            <Save className="w-4 h-4 mr-1.5" /> Save Payment Details
          </ShimmerButton>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Upload,
  Save,
  CheckCircle,
  Key,
  CreditCard,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  Globe,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { SegmentedControl } from '../../components/reactbits/SegmentedControl.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';
import { useSiteConfig } from '../../context/SiteConfigContext.js';
import { SEO } from '../../components/common/SEO.js';

export const SuperAdminPaymentConfig: React.FC = () => {
  const { showToast } = useToast();
  const { siteName, siteTagline, description, updateSettings: updateContextSettings } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<'branding' | 'imgbb' | 'payment'>('branding');

  // --- Branding / General Settings State ---
  const [siteNameInput, setSiteNameInput] = useState(siteName);
  const [siteTaglineInput, setSiteTaglineInput] = useState(siteTagline);
  const [siteDescInput, setSiteDescInput] = useState(description);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Sync initial branding when context loads
  useEffect(() => {
    setSiteNameInput(siteName);
    setSiteTaglineInput(siteTagline);
    setSiteDescInput(description);
  }, [siteName, siteTagline, description]);

  // --- Payment Gateway State ---
  const [upiId, setUpiId] = useState('');
  const [paymentName, setPaymentName] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // --- ImgBB API Keys State ---
  const [imgbbKeys, setImgbbKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  // Load Payment Config
  useEffect(() => {
    api
      .get<{ success: boolean; config: any }>('/superadmin/payment-config')
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

  // Load ImgBB Keys
  const fetchImgbbKeys = async () => {
    try {
      setIsLoadingKeys(true);
      const res = await api.get<{ success: boolean; keys: string[] }>('/superadmin/imgbb-keys');
      if (res.success) {
        setImgbbKeys(res.keys || []);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchImgbbKeys();
  }, []);

  // --- Branding Save Action ---
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteNameInput.trim()) {
      showToast('Website name cannot be empty', 'error');
      return;
    }

    try {
      setIsSavingBranding(true);
      await updateContextSettings({
        siteName: siteNameInput.trim(),
        siteTagline: siteTaglineInput.trim(),
        description: siteDescInput.trim(),
      });
      showToast(`Website name updated to "${siteNameInput.trim()}"! Changes reflected immediately across the site.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update website branding', 'error');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // --- ImgBB Key Actions ---
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newKey.trim();
    if (!clean) {
      showToast('Please enter a valid ImgBB API key', 'error');
      return;
    }
    if (clean.length < 16) {
      showToast('API key is too short. Please provide a valid 32-character key.', 'error');
      return;
    }

    try {
      setIsAddingKey(true);
      const res = await api.post<{ success: boolean; message: string; keys: string[] }>(
        '/superadmin/imgbb-keys',
        { key: clean }
      );
      if (res.success) {
        setImgbbKeys(res.keys);
        setNewKey('');
        showToast('ImgBB API key added to active pool! 🚀', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add ImgBB key', 'error');
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleRemoveKey = async (keyToRemove: string) => {
    if (!window.confirm('Are you sure you want to remove this API key from the upload pool?')) {
      return;
    }

    try {
      const res = await api.delete<{ success: boolean; message: string; keys: string[] }>(
        '/superadmin/imgbb-keys',
        { key: keyToRemove }
      );
      if (res.success) {
        setImgbbKeys(res.keys);
        showToast('ImgBB API key removed', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove API key', 'error');
    }
  };

  const handleTestKey = async (keyToTest: string) => {
    try {
      setTestingKey(keyToTest);
      const res = await api.post<{ success: boolean; message: string }>(
        '/superadmin/imgbb-keys/test',
        { key: keyToTest }
      );
      if (res.success) {
        showToast(res.message || 'Key is verified and working with ImgBB! ✅', 'success');
      } else {
        showToast(res.message || 'Key validation failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Connection test failed', 'error');
    } finally {
      setTestingKey(null);
    }
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied API key to clipboard', 'info');
  };

  // --- Payment Config Actions ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.uploadFile(file);
      if (res.success) {
        setQrCodeUrl(res.url);
        showToast('QR Code uploaded to ImgBB successfully! 🌟', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !paymentName) {
      showToast('UPI ID and Payment Name are required', 'error');
      return;
    }

    try {
      setIsSavingPayment(true);
      await api.put('/superadmin/payment-config', {
        upiId,
        paymentName,
        paymentInstructions,
        qrCode: qrCodeUrl,
      });
      showToast('Payment configuration updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment config', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <SEO
        title="Platform Settings & Branding"
        description="Configure website branding, site name, ImgBB API keys, and Super Admin payment gateway details."
      />
      <Header title="Platform Settings" subtitle="Branding, ImgBB & Gateway" showBack />

      <div className="p-4 flex flex-col gap-4">
        {/* Navigation Tabs */}
        <SegmentedControl
          options={[
            { id: 'branding', label: 'Branding', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'imgbb', label: 'ImgBB Cloud', icon: <Key className="w-3.5 h-3.5" /> },
            { id: 'payment', label: 'Payments', icon: <CreditCard className="w-3.5 h-3.5" /> },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'branding' | 'imgbb' | 'payment')}
        />

        {/* ----------------- TAB 1: WEBSITE BRANDING & NAME ----------------- */}
        {activeTab === 'branding' && (
          <form
            onSubmit={handleSaveBranding}
            className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-ios-blue">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Website Identity & Name</h3>
                  <p className="text-[11px] text-slate-500">Live dynamic branding throughout application</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                Live: <span className="text-ios-blue font-bold">{siteName}</span>
              </div>
            </div>

            <Input
              label="Website Name"
              placeholder="e.g. Libr, StudyNest, ApexLibrary"
              value={siteNameInput}
              onChange={(e) => setSiteNameInput(e.target.value)}
              required
            />

            <Input
              label="Tagline / Subtitle"
              placeholder="e.g. Multi-Library & Study Center Management"
              value={siteTaglineInput}
              onChange={(e) => setSiteTaglineInput(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Platform Description & SEO Meta</label>
              <textarea
                rows={3}
                placeholder="Default description used for search engine snippets and social preview cards..."
                value={siteDescInput}
                onChange={(e) => setSiteDescInput(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              />
            </div>

            <ShimmerButton type="submit" size="lg" isLoading={isSavingBranding} className="w-full mt-2">
              <Save className="w-4 h-4 mr-1.5" /> Save Website Name & Branding
            </ShimmerButton>
          </form>
        )}

        {/* ----------------- TAB 2: IMGBB CDN ----------------- */}
        {activeTab === 'imgbb' && (
          <div className="flex flex-col gap-4">
            {/* Status Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-ios flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ImgBB Cloud CDN Pool</h3>
                    <p className="text-[11px] text-slate-300">Distributed & Failover Uploads</p>
                  </div>
                </div>
                {imgbbKeys.length > 0 ? (
                  <PulseBadge status="ACTIVE" size="sm">
                    {imgbbKeys.length} {imgbbKeys.length === 1 ? 'Key' : 'Keys'} Active
                  </PulseBadge>
                ) : (
                  <PulseBadge status="SUSPENDED" size="sm">
                    No Keys Configured
                  </PulseBadge>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                All platform images (QR codes, library payment receipts, avatars) are hosted on ImgBB.
                Uploads randomly pick an active key from your pool. If any key reaches its hourly limit
                or encounters an error, the system automatically fails over to other configured keys.
              </p>
            </div>

            {/* Configured Keys List */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Configured API Keys ({imgbbKeys.length})
                </span>
                <button
                  type="button"
                  onClick={fetchImgbbKeys}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Refresh keys"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingKeys ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {imgbbKeys.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                  <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No ImgBB Keys Added Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-[260px]">
                    Image uploads will fail until at least one API key is added below.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {imgbbKeys.map((k, index) => {
                    const isVisible = visibleKeys[k];
                    const masked = isVisible
                      ? k
                      : `${k.slice(0, 4)}••••••••••••••••${k.slice(-4)}`;
                    const isTestingThis = testingKey === k;

                    return (
                      <div
                        key={k}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-mono text-xs text-slate-800 truncate select-all">
                            {masked}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(k)}
                            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
                            title={isVisible ? 'Hide key' : 'Show key'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(k)}
                            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Copy key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isTestingThis}
                            onClick={() => handleTestKey(k)}
                            className="px-2 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-ios-blue text-[11px] font-semibold transition-colors flex items-center gap-1 active:scale-95"
                            title="Test connectivity to ImgBB"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTestingThis ? 'animate-spin' : ''}`} />
                            {isTestingThis ? 'Testing...' : 'Test'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveKey(k)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors active:scale-95"
                            title="Remove key"
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

            {/* Add New Key Card */}
            <form
              onSubmit={handleAddKey}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-ios-blue" /> Add New ImgBB Key
                </span>
                <a
                  href="https://api.imgbb.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-ios-blue font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Get free key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <Input
                placeholder="Paste 32-character ImgBB API key..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
              />

              <div className="flex items-center gap-2">
                <ShimmerButton
                  type="submit"
                  size="md"
                  isLoading={isAddingKey}
                  disabled={!newKey.trim() || isAddingKey}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add to Key Pool
                </ShimmerButton>

                {newKey.trim() && (
                  <button
                    type="button"
                    disabled={testingKey === 'new' || isAddingKey}
                    onClick={() => handleTestKey(newKey)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingKey === 'new' ? 'animate-spin' : ''}`} />
                    Test First
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ----------------- TAB 3: PAYMENT GATEWAY ----------------- */}
        {activeTab === 'payment' && (
          <form
            onSubmit={handleSavePayment}
            className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-4"
          >
            <Input
              label="Super Admin UPI ID"
              placeholder="e.g. platform@icici"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />

            <Input
              label="Payment Display Name"
              placeholder="e.g. Platform Subscriptions"
              value={paymentName}
              onChange={(e) => setPaymentName(e.target.value)}
              required
            />

            {/* QR Code Upload Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Official UPI QR Code</label>
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
                    {isUploading ? 'Uploading to ImgBB...' : 'Upload QR Image'}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Uploaded directly to ImgBB CDN (Max 16MB)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Payment Instructions</label>
              <textarea
                rows={4}
                placeholder="Instructions displayed to admins when purchasing a plan..."
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              />
            </div>

            <ShimmerButton type="submit" size="lg" isLoading={isSavingPayment} className="w-full mt-2">
              <Save className="w-4 h-4 mr-1.5" /> Save Configuration
            </ShimmerButton>
          </form>
        )}
      </div>
    </div>
  );
};

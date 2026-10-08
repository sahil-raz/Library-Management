import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.js';

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess?: () => void;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('EXPIRY_2_DAYS');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ waLink?: string; messageText?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    api
      .get<{ success: boolean; templates: any[] }>('/admin/whatsapp/templates')
      .then((res) => {
        if (res.success) setTemplates(res.templates);
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await api.post<{
        success: boolean;
        message: string;
        waLink: string;
        messageText: string;
      }>('/admin/whatsapp/send', {
        userId: student._id,
        templateKey: selectedTemplateKey,
        customMessage,
      });

      setResult({ waLink: res.waLink, messageText: res.messageText });
      showToast('WhatsApp alert logged successfully!', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to send WhatsApp alert (Quota exceeded?)', 'error');
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
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Send WhatsApp Notice</h3>
              <p className="text-[11px] text-slate-500">Student: {student.name} ({student.phone})</p>
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
        {result ? (
          <div className="p-5 space-y-4 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">WhatsApp Alert Prepared!</h4>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-[11px] text-slate-700 font-mono whitespace-pre-wrap">
              {result.messageText}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {result.waLink && (
                <a
                  href={result.waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open & Send in WhatsApp App</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4 text-xs">
            {/* Template Selection */}
            <div>
              <label className="block text-slate-600 font-bold mb-1.5">Select Message Template</label>
              <div className="space-y-2">
                {templates.map((t) => (
                  <label
                    key={t.id}
                    className={`block p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedTemplateKey === t.id
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="template"
                        value={t.id}
                        checked={selectedTemplateKey === t.id}
                        onChange={() => setSelectedTemplateKey(t.id)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-xs">{t.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 pl-5 line-clamp-2">
                      {t.template}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {selectedTemplateKey === 'CUSTOM' && (
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Custom Message Text</label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type custom notification to student..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/30 outline-none"
                  required
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 text-[11px]">
              📌 Sending this message will record one alert against your SaaS plan's allotted WhatsApp alert limit.
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Preparing...' : 'Generate & Send WhatsApp'}</span>
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
        )}
      </div>
    </div>
  );
};

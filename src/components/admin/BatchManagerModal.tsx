import React, { useEffect, useState } from 'react';
import { X, Clock, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Input } from '../common/Input.js';
import { useToast } from '../../context/ToastContext.js';

interface BatchManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchesUpdated?: () => void;
}

export const BatchManagerModal: React.FC<BatchManagerModalProps> = ({ isOpen, onClose, onBatchesUpdated }) => {
  const { showToast } = useToast();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Batch Form
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; batches: any[] }>('/admin/batches');
      if (res.success) setBatches(res.batches);
    } catch (err: any) {
      showToast(err.message || 'Failed to load batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchBatches();
  }, [isOpen]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Batch name is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/admin/batches', {
        name: name.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        description: description.trim(),
      });
      showToast('Session batch created!', 'success');
      setName('');
      setDescription('');
      fetchBatches();
      if (onBatchesUpdated) onBatchesUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to create batch', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this session batch?')) return;
    try {
      await api.delete(`/admin/batches/${batchId}`);
      showToast('Batch deleted', 'info');
      fetchBatches();
      if (onBatchesUpdated) onBatchesUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete batch (Active students assigned?)', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manage Session Timing Batches</h3>
              <p className="text-[11px] text-slate-500">Define library shifts (e.g. Morning, Evening, Full Day)</p>
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
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Create Form */}
          <form onSubmit={handleCreateBatch} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Add New Session Timing Batch</span>
            <Input
              label="Batch Name"
              placeholder="e.g. Morning Batch or Evening Shift"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Start Time"
                placeholder="08:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="End Time"
                placeholder="01:00 PM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Session Batch</span>
            </button>
          </form>

          {/* List of Batches */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Configured Batches ({batches.length})</span>
            {loading ? (
              <div className="text-center text-xs text-slate-400 py-4">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                No session batches created yet. Add your first session batch above!
              </div>
            ) : (
              batches.map((b) => (
                <div
                  key={b._id}
                  className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{b.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {b.startTime} - {b.endTime}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBatch(b._id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Layers, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { SegmentedControl } from '../../components/reactbits/SegmentedControl.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useToast } from '../../context/ToastContext.js';

export const UserPlanCreator: React.FC = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(499);
  const [validity, setValidity] = useState(30);
  const [validityUnit, setValidityUnit] = useState<string>('Days');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Reserved Study Seat',
    'High Speed WiFi',
    'Locker Facility',
    'Drinking Water & AC',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; plans: any[] }>('/admin/plans');
      if (res.success) setPlans(res.plans);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlanId(null);
    setName('');
    setPrice(499);
    setValidity(30);
    setValidityUnit('Days');
    setDescription('');
    setFeatures(['Reserved Study Seat', 'High Speed WiFi', 'Locker Facility']);
    setIsModalOpen(true);
  };

  const openEditModal = (pl: any) => {
    setEditingPlanId(pl._id);
    setName(pl.name);
    setPrice(pl.price);
    setValidity(pl.validity);
    setValidityUnit(pl.validityUnit || 'Days');
    setDescription(pl.description || '');
    setFeatures(pl.features || ['Reserved Study Seat', 'High Speed WiFi']);
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Plan name is required', 'error');
      return;
    }

    const payload = {
      name,
      price: Number(price),
      currency: 'INR',
      validity: Number(validity),
      validityUnit,
      description,
      features,
    };

    try {
      if (editingPlanId) {
        await api.patch(`/admin/plans/${editingPlanId}`, payload);
        showToast('Membership plan updated', 'success');
      } else {
        await api.post('/admin/plans', payload);
        showToast('New membership plan published!', 'success');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to save plan', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Delete this user plan?')) return;
    try {
      await api.delete(`/admin/plans/${planId}`);
      showToast('Plan removed', 'info');
      fetchPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete plan', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Student Membership Plans"
        subtitle="Manage Pricing Tiers & Member Perks"
        showBack
        rightAction={
          <button
            onClick={openCreateModal}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Create Student Plan"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Student Membership Plans</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Create monthly, quarterly, or yearly plans for students to subscribe to.
            </p>
            <ShimmerButton onClick={openCreateModal} size="md">
              Create First Student Plan
            </ShimmerButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {plans.map((pl) => (
              <div
                key={pl._id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{pl.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-ios-blue text-[9px] font-bold uppercase tracking-wider">
                        Student Plan
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-slate-900">₹{pl.price}</span>
                      <span className="text-xs font-semibold text-slate-400">
                        / {pl.validity} {pl.validityUnit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(pl)}
                      className="p-2 rounded-xl text-slate-400 hover:text-ios-blue hover:bg-blue-50 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(pl._id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {pl.description && <p className="text-xs text-slate-500">{pl.description}</p>}

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

      {/* Create Plan BottomSheet */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlanId ? 'Edit Plan' : 'Create Student Plan'}
      >
        <form onSubmit={handleSavePlan} className="flex flex-col gap-3.5">
          <Input
            label="Plan Name"
            placeholder="e.g. Monthly Standard (Full Day)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Price (INR ₹)"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
            <Input
              label="Duration"
              type="number"
              min="1"
              value={validity}
              onChange={(e) => setValidity(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Validity Unit</label>
            <SegmentedControl
              options={[
                { id: 'Days', label: 'Days' },
                { id: 'Months', label: 'Months' },
                { id: 'Years', label: 'Years' },
              ]}
              value={validityUnit}
              onChange={(val) => setValidityUnit(val)}
            />
          </div>

          <Input
            label="Description (Optional)"
            placeholder="e.g. Unlimited 24/7 access with locker"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Dynamic Features List */}
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Included Perks & Features
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Personal Locker"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 rounded-2xl bg-slate-200 text-slate-800 text-xs font-bold active:scale-95"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {features.map((feat, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                >
                  {feat}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <ShimmerButton type="submit" size="lg" className="w-full mt-2">
            Publish Membership Plan
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

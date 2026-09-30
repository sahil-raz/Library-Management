import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X, Layers, Edit2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { SEO } from '../../components/common/SEO.js';
import { Input } from '../../components/common/Input.js';
import { SegmentedControl } from '../../components/reactbits/SegmentedControl.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';

export const SaaSPlanCreator: React.FC = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(999);
  const [currency] = useState('INR');
  const [validity, setValidity] = useState(30);
  const [validityUnit, setValidityUnit] = useState<string>('Days');
  const [features, setFeatures] = useState<string[]>([
    'Up to 3 Branches',
    'Up to 5 Managers',
    'Up to 500 Users',
    'Up to 300 Seats',
    'WhatsApp Reminders',
    'Queue Management',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Limits
  const [maxBranches, setMaxBranches] = useState(3);
  const [maxManagers, setMaxManagers] = useState(5);
  const [maxUsers, setMaxUsers] = useState(500);
  const [maxSeats, setMaxSeats] = useState(300);
  const [maxMessages, setMaxMessages] = useState(1000);
  const [maxQueueEntries, setMaxQueueEntries] = useState(100);
  const [maxStorageMB, setMaxStorageMB] = useState(1024);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; plans: any[] }>('/superadmin/plans');
      if (res.success) setPlans(res.plans);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch plans', 'error');
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
    setPrice(999);
    setValidity(30);
    setValidityUnit('Days');
    setMaxBranches(3);
    setMaxManagers(5);
    setMaxUsers(500);
    setMaxSeats(300);
    setMaxMessages(1000);
    setMaxQueueEntries(100);
    setMaxStorageMB(1024);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlanId(plan._id);
    setName(plan.name);
    setPrice(plan.price);
    setValidity(plan.validity);
    setValidityUnit(plan.validityUnit);
    setFeatures(plan.features || []);
    setMaxBranches(plan.maxBranches);
    setMaxManagers(plan.maxManagers);
    setMaxUsers(plan.maxUsers);
    setMaxSeats(plan.maxSeats);
    setMaxMessages(plan.maxMessages);
    setMaxQueueEntries(plan.maxQueueEntries);
    setMaxStorageMB(plan.maxStorageMB);
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
    if (!name) {
      showToast('Plan name is required', 'error');
      return;
    }

    const payload = {
      name,
      price: Number(price),
      currency,
      validity: Number(validity),
      validityUnit,
      features,
      maxBranches: Number(maxBranches),
      maxManagers: Number(maxManagers),
      maxUsers: Number(maxUsers),
      maxSeats: Number(maxSeats),
      maxMessages: Number(maxMessages),
      maxQueueEntries: Number(maxQueueEntries),
      maxStorageMB: Number(maxStorageMB),
    };

    try {
      if (editingPlanId) {
        await api.patch(`/superadmin/plans/${editingPlanId}`, payload);
        showToast('Plan updated successfully', 'success');
      } else {
        await api.post('/superadmin/plans', payload);
        showToast('New subscription plan created!', 'success');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      showToast(err.message || 'Failed to save plan', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/superadmin/plans/${planId}`);
      showToast('Plan deleted', 'info');
      fetchPlans();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete active plan with subscribers', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <SEO
        title="Subscription Plans & Tiers"
        description="Design, create, and manage SaaS subscription plans, user quotas, branch limits, and pricing."
      />
      <Header
        title="Subscription Plans"
        subtitle="Pricing, Quotas & Limits"
        rightAction={
          <button
            onClick={openCreateModal}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
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
            <h3 className="text-sm font-bold text-slate-700">No Plans Configured</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Create your first plan so library admins can subscribe.
            </p>
            <ShimmerButton onClick={openCreateModal} size="md">
              Create First Plan
            </ShimmerButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-ios flex flex-col gap-3.5 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                      <span className="text-xs font-semibold text-slate-400">
                        / {plan.validity} {plan.validityUnit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Limit badges grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Branches</span>
                    <strong className="text-xs text-slate-800 font-bold">{plan.maxBranches}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Managers</span>
                    <strong className="text-xs text-slate-800 font-bold">{plan.maxManagers}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Users</span>
                    <strong className="text-xs text-slate-800 font-bold">{plan.maxUsers}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Seats</span>
                    <strong className="text-xs text-slate-800 font-bold">{plan.maxSeats}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Messages</span>
                    <strong className="text-xs text-slate-800 font-bold">{plan.maxMessages}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Queue</span>
                    <strong className="text-xs text-slate-800 font-bold">{plan.maxQueueEntries}</strong>
                  </div>
                </div>

                {/* Features list */}
                {plan.features?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {plan.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
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

      {/* Create / Edit Plan BottomSheet */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlanId ? 'Edit Plan' : 'Create Plan'}
      >
        <form onSubmit={handleSavePlan} className="flex flex-col gap-4">
          <Input
            label="Plan Name"
            placeholder="e.g. Growth Pro"
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
              label="Validity Duration"
              type="number"
              min="1"
              value={validity}
              onChange={(e) => setValidity(Number(e.target.value))}
              required
            />
          </div>

          {/* Segmented Switch for Validity Unit */}
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

          <div className="border-t border-slate-100 pt-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Subscription Limits
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Max Branches"
                type="number"
                min="1"
                value={maxBranches}
                onChange={(e) => setMaxBranches(Number(e.target.value))}
                required
              />
              <Input
                label="Max Managers"
                type="number"
                min="1"
                value={maxManagers}
                onChange={(e) => setMaxManagers(Number(e.target.value))}
                required
              />
              <Input
                label="Max Users / Patrons"
                type="number"
                min="1"
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
                required
              />
              <Input
                label="Max Seats"
                type="number"
                min="1"
                value={maxSeats}
                onChange={(e) => setMaxSeats(Number(e.target.value))}
                required
              />
              <Input
                label="Max Messages"
                type="number"
                min="0"
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
                required
              />
              <Input
                label="Max Queue Entries"
                type="number"
                min="0"
                value={maxQueueEntries}
                onChange={(e) => setMaxQueueEntries(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Dynamic Features List */}
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Included Features
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. 24/7 Priority Support"
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
            {editingPlanId ? 'Update Plan' : 'Save & Publish Plan'}
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

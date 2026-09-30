import React, { useEffect, useState } from 'react';
import { Receipt, Plus, IndianRupee, Calendar, Tag, Building2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useToast } from '../../context/ToastContext.js';

export const Expenses: React.FC = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Electricity',
    date: new Date().toISOString().split('T')[0],
    description: '',
    branchId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
      const [eRes, bRes] = await Promise.all([
        api.get<{ success: boolean; expenses: any[]; totalExpenses: number }>(`/admin/expenses${params}`),
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
      ]);

      if (eRes.success) {
        setExpenses(eRes.expenses);
        setTotalExpenses(eRes.totalExpenses);
      }
      if (bRes.success) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0 && !formData.branchId) {
          setFormData((prev) => ({ ...prev, branchId: bRes.branches[0]._id }));
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId || !formData.title || !formData.amount) {
      showToast('Branch, Title and Amount are required', 'error');
      return;
    }

    try {
      await api.post('/admin/expenses', {
        ...formData,
        amount: Number(formData.amount),
      });
      showToast('Expense recorded', 'success');
      setIsModalOpen(false);
      setFormData({
        title: '',
        amount: '',
        category: 'Electricity',
        date: new Date().toISOString().split('T')[0],
        description: '',
        branchId: branches[0]?._id || '',
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Branch Expenses"
        subtitle="Track Utilities & Maintenance"
        showBack
        rightAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Add Expense"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Total Expense Summary Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-ios flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Recorded Outflow
            </span>
            <span className="text-2xl font-black text-rose-600">₹{totalExpenses.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Branch Filter */}
        {branches.length > 1 && (
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {/* Expenses List */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Expenses Logged</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Track electric, internet, and cleaning costs.
            </p>
            <ShimmerButton onClick={() => setIsModalOpen(true)} size="md">
              Log First Expense
            </ShimmerButton>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {expenses.map((ex) => (
              <div
                key={ex._id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{ex.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{ex.branchId?.name}</span>
                    <span>•</span>
                    <span>{new Date(ex.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{ex.category}</span>
                  </div>
                  {ex.description && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">{ex.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-rose-600">₹{ex.amount}</span>
                  <span className="text-[10px] text-slate-400 block">{ex.recordedByRole}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Branch Expense"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
          <Input
            label="Expense Title"
            placeholder="e.g. Electricity Bill, High Speed Broadband"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Amount (INR ₹)"
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              >
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Internet">Internet / WiFi</option>
                <option value="Cleaning">Cleaning / Housekeeping</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Rent">Branch Rent</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">Branch</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
                required
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Description / Bill Reference (Optional)"
            placeholder="e.g. Paid via UPI reference #83726"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <ShimmerButton type="submit" size="lg" className="w-full mt-2">
            Save Expense
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

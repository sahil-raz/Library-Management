import React, { useEffect, useState } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ManagerPermissionSet } from '../../types/index.js';

export const ManagerExpenses: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const perms = (user?.permissions || {}) as Partial<ManagerPermissionSet>;

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Electricity');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; expenses: any[] }>('/manager/expenses');
      if (res.success) setExpenses(res.expenses);
    } catch (err: any) {
      showToast(err.message || 'Failed to load branch expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/manager/expenses', {
        title,
        amount: Number(amount),
        category,
        date,
        description,
      });
      showToast('Branch expense logged', 'success');
      setIsAddOpen(false);
      setTitle('');
      setAmount('');
      setDescription('');
      fetchExpenses();
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Branch Expenses"
        subtitle="Utilities & Maintenance"
        showBack
        rightAction={
          perms.expenses_add ? (
            <button
              onClick={() => setIsAddOpen(true)}
              className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : null
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Branch Expenses Logged</h3>
            <p className="text-xs text-slate-400 mt-1">Keep track of electricity, water and cleaning bills.</p>
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
                    <span>{new Date(ex.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{ex.category}</span>
                  </div>
                </div>
                <span className="text-sm font-black text-rose-600">₹{ex.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {perms.expenses_add && (
        <BottomSheet
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add Branch Expense"
        >
          <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
            <Input
              label="Expense Title"
              placeholder="e.g. Electricity, Water"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Amount (INR ₹)"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
              >
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Internet">Internet / WiFi</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Input
              label="Description (Optional)"
              placeholder="e.g. Paid online"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <ShimmerButton type="submit" size="lg" className="w-full mt-2">
              Save Expense
            </ShimmerButton>
          </form>
        </BottomSheet>
      )}
    </div>
  );
};

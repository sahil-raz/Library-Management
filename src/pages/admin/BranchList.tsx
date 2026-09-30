import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Clock, Phone, Mail, MapPin, Users, Armchair } from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { BottomSheet } from '../../components/reactbits/BottomSheet.js';
import { ShimmerButton } from '../../components/reactbits/ShimmerButton.js';
import { PulseBadge } from '../../components/reactbits/PulseBadge.js';
import { useToast } from '../../context/ToastContext.js';

export const BranchList: React.FC = () => {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '08:00 AM',
    closingTime: '10:00 PM',
    status: 'ACTIVE',
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; branches: any[] }>('/admin/branches');
      if (res.success) setBranches(res.branches);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openCreateModal = () => {
    setEditingBranchId(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      openingTime: '08:00 AM',
      closingTime: '10:00 PM',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBranchId(b._id);
    setFormData({
      name: b.name,
      address: b.address,
      phone: b.phone,
      email: b.email,
      openingTime: b.openingTime,
      closingTime: b.closingTime,
      status: b.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranchId) {
        await api.patch(`/admin/branches/${editingBranchId}`, formData);
        showToast('Branch updated', 'success');
      } else {
        await api.post('/admin/branches', formData);
        showToast('New branch created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      showToast(err.message || 'Failed to save branch', 'error');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await api.delete(`/admin/branches/${branchId}`);
      showToast('Branch deleted', 'info');
      fetchBranches();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete branch with active users', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      <Header
        title="Branches"
        subtitle="Manage Library Locations"
        rightAction={
          <button
            onClick={openCreateModal}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all"
            title="Add Branch"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-8">Loading branches...</div>
        ) : branches.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 mt-4">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Branches Yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add your main study center branch to start assigning seats.
            </p>
            <ShimmerButton onClick={openCreateModal} size="md">
              Add First Branch
            </ShimmerButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {branches.map((b) => (
              <div
                key={b._id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{b.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PulseBadge status={b.status} size="sm" />
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-purple-600" />
                    <span>
                      Seats: <strong>{b.assignedSeatCount || 0}</strong> / {b.seatCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ios-blue" />
                    <span>
                      Students: <strong>{b.userCount || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {b.openingTime} - {b.closingTime}
                  </span>
                  <span>{b.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit BottomSheet */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranchId ? 'Edit Branch' : 'Add New Branch'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          <Input
            label="Branch Name"
            placeholder="e.g. South Extension Branch"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Full Physical Address"
            placeholder="e.g. 2nd Floor, Main Market, Ring Road"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Branch Email"
              type="email"
              placeholder="branch@library.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Opening Time"
              placeholder="08:00 AM"
              value={formData.openingTime}
              onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
              required
            />
            <Input
              label="Closing Time"
              placeholder="10:00 PM"
              value={formData.closingTime}
              onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
              required
            />
          </div>

          <ShimmerButton type="submit" size="lg" className="w-full mt-2">
            {editingBranchId ? 'Update Branch' : 'Create Branch'}
          </ShimmerButton>
        </form>
      </BottomSheet>
    </div>
  );
};

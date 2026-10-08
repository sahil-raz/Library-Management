import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Armchair,
  Clock,
  X,
  Printer,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Header } from '../../components/common/Header.js';
import { Input } from '../../components/common/Input.js';
import { useToast } from '../../context/ToastContext.js';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal.js';
import { IDCardModal } from '../../components/common/IDCardModal.js';
import { RenewPlanModal } from '../../components/admin/RenewPlanModal.js';
import { SendWhatsAppModal } from '../../components/admin/SendWhatsAppModal.js';

export const UserList: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, expiring_soon: 0, expired: 0 });
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');

  // Create Student Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    classCourse: '',
    address: '',
    photo: '',
    parentName: '',
    parentPhone: '',
    aadharNumber: '',
    dateOfBirth: '',
    gender: 'Male',
    branchId: '',
    batchId: '',
    seatId: '',
    planId: '',
  });

  // Action Modals State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [idCardData, setIdCardData] = useState<any>(null);
  const [studentToRenew, setStudentToRenew] = useState<any>(null);
  const [studentToSendWhatsApp, setStudentToSendWhatsApp] = useState<any>(null);

  const fetchDependencies = async () => {
    try {
      const [bRes, batchRes, pRes, sRes] = await Promise.all([
        api.get<{ success: boolean; branches: any[] }>('/admin/branches'),
        api.get<{ success: boolean; batches: any[] }>('/admin/batches'),
        api.get<{ success: boolean; plans: any[] }>('/admin/plans'),
        api.get<{ success: boolean; seats: any[] }>('/admin/seats'),
      ]);

      if (bRes.success) {
        setBranches(bRes.branches);
        if (bRes.branches.length > 0 && !formData.branchId) {
          setFormData(prev => ({ ...prev, branchId: bRes.branches[0]._id }));
        }
      }
      if (batchRes.success) {
        setBatches(batchRes.batches);
        if (batchRes.batches.length > 0 && !formData.batchId) {
          setFormData(prev => ({ ...prev, batchId: batchRes.batches[0]._id }));
        }
      }
      if (pRes.success) {
        setPlans(pRes.plans);
        if (pRes.plans.length > 0 && !formData.planId) {
          setFormData(prev => ({ ...prev, planId: pRes.plans[0]._id }));
        }
      }
      if (sRes.success) setSeats(sRes.seats);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('filter', statusFilter);

      const res = await api.get<{
        success: boolean;
        users: any[];
        counts: { all: number; active: number; expiring_soon: number; expired: number };
      }>(`/admin/users?${params}`);

      if (res.success) {
        setUsers(res.users);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter available seats for the currently selected batch in the creation modal
  const seatsForSelectedBatch = seats.filter(seat => {
    if (formData.branchId && seat.branchId?._id !== formData.branchId) return false;
    return true;
  }).map(seat => {
    const isOccupiedInBatch = seat.activeAssignments?.some(
      (a: any) => (a.batchId?._id || a.batchId) === formData.batchId
    );
    return {
      ...seat,
      isOccupiedInBatch,
    };
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.parentName || !formData.parentPhone) {
      showToast('Please fill all required student and parent fields', 'error');
      return;
    }
    if (!formData.branchId || !formData.batchId || !formData.seatId || !formData.planId) {
      showToast('Please select Branch, Session Batch, Seat, and Plan', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post<{ success: boolean; message: string; user: any }>(
        '/admin/users',
        formData
      );

      showToast(res.message || 'Student enrolled successfully!', 'success');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        phone: '',
        classCourse: '',
        address: '',
        photo: '',
        parentName: '',
        parentPhone: '',
        aadharNumber: '',
        dateOfBirth: '',
        gender: 'Male',
        branchId: branches[0]?._id || '',
        batchId: batches[0]?._id || '',
        seatId: '',
        planId: plans[0]?._id || '',
      });
      fetchUsers();
      fetchDependencies();
    } catch (err: any) {
      showToast(err.message || 'Failed to enroll student (Seat occupied in batch?)', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenIdCard = async (student: any) => {
    try {
      const res = await api.get<{ success: boolean; idCard: any }>(`/admin/users/${student._id}/id-card`);
      if (res.success) {
        setIdCardData(res.idCard);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load ID card data', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-12 min-h-screen">
      <Header
        title="Students & Patrons"
        subtitle="Manage Library Members"
        showBack
        rightAction={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-2 rounded-full bg-ios-blue text-white shadow-sm active:scale-95 transition-all flex items-center justify-center"
            title="Enroll Student"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-3.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, phone, parent, course, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Required Filter Tabs: All, Active, Expiring Soon, Expired */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Students</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px]">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>Active</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              {counts.active}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              statusFilter === 'expiring_soon'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expiring Soon (&lt;5d)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px]">
              {counts.expiring_soon}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              statusFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span>Plan Expired</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">
              {counts.expired}
            </span>
          </button>
        </div>

        {/* Student Cards List */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-12">Loading student directory...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 mt-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add your first student and allocate their desk and timing batch.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-ios-blue text-white rounded-xl text-xs font-bold"
            >
              Enroll Student Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((student) => {
              const { daysRemaining, isExpired, isExpiringSoon } = student;

              return (
                <div
                  key={student._id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-ios hover:shadow-md transition-all flex flex-col gap-3"
                >
                  {/* Top Bar: Photo, Name, Plan Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{student.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              isExpired
                                ? 'bg-rose-100 text-rose-700'
                                : isExpiringSoon
                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isExpired ? 'Expired' : `${daysRemaining}d left`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{student.phone}</p>
                        {student.classCourse && (
                          <p className="text-[10px] font-bold text-ios-blue truncate">{student.classCourse}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="View Full Profile"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Seat, Batch & Plan Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Armchair className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                      <span className="font-bold text-slate-800 truncate">
                        {student.currentSeat?.seatNumber ? `Desk ${student.currentSeat.seatNumber}` : 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">
                        {student.batchId?.name || 'Full Day'}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">
                        Plan: <strong className="text-slate-800">{student.currentPlan?.name || 'Standard'}</strong>
                      </span>
                      <span className="text-slate-500">
                        Valid till:{' '}
                        <strong className={isExpired ? 'text-rose-600' : 'text-emerald-700'}>
                          {student.planEndDate ? new Date(student.planEndDate).toLocaleDateString() : 'N/A'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons: ID Card, Renew Plan, WhatsApp Notice */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {/* ID Card Generator */}
                    <button
                      onClick={() => handleOpenIdCard(student)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>ID Card</span>
                    </button>

                    {/* Renew Plan */}
                    <button
                      onClick={() => setStudentToRenew(student)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-ios-blue font-bold text-[11px] border border-blue-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renew Plan</span>
                    </button>

                    {/* Send WhatsApp */}
                    <button
                      onClick={() => setStudentToSendWhatsApp(student)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      title="Send WhatsApp Alert"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Alert</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enroll Student Modal (No Credentials, Admin sets details + Batch + Seat + Plan) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Enroll New Student</h3>
                <p className="text-[11px] text-slate-500">Add student details, assign batch timing, seat and plan</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              {/* Student Basic Details */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block uppercase text-[10px]">Student Information</span>
                <Input
                  label="Student Full Name *"
                  name="name"
                  placeholder="e.g. Amit Kumar"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Student Phone Number *"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label="Class / Course (Optional)"
                    name="classCourse"
                    placeholder="e.g. UPSC / NEET"
                    value={formData.classCourse}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                <Input
                  label="Address"
                  name="address"
                  placeholder="e.g. Room 402, Gandhi Nagar"
                  value={formData.address}
                  onChange={handleInputChange}
                />

                <Input
                  label="Student Photo URL / Link"
                  name="photo"
                  placeholder="https://..."
                  value={formData.photo}
                  onChange={handleInputChange}
                />
              </div>

              {/* Parent Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block uppercase text-[10px]">Parent / Guardian Contact</span>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Parent / Guardian Name *"
                    name="parentName"
                    placeholder="e.g. Suresh Kumar"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label="Parent Phone Number *"
                    name="parentPhone"
                    type="tel"
                    placeholder="9876543211"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <Input
                  label="Aadhar Number (Optional)"
                  name="aadharNumber"
                  placeholder="e.g. 1234 5678 9012"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                />
              </div>

              {/* Library Allocations: Branch, Batch Timing, Seat, Plan */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block uppercase text-[10px]">Library Desk & Plan Allocation</span>

                {branches.length > 1 && (
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Select Branch *</label>
                    <select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                      required
                    >
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Session Batch Timing Selection */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Select Session Timing Batch *
                  </label>
                  {batches.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px]">
                      ⚠️ No batches created yet. Please add a session batch first in Seat Management!
                    </div>
                  ) : (
                    <select
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none"
                      required
                    >
                      {batches.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.startTime} - {b.endTime})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Seat Selection (Filters out occupied seats in this batch) */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Select Desk / Seat (Must be free in chosen batch) *
                  </label>
                  <select
                    name="seatId"
                    value={formData.seatId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none"
                    required
                  >
                    <option value="">-- Choose an Available Seat --</option>
                    {seatsForSelectedBatch.map(s => (
                      <option
                        key={s._id}
                        value={s._id}
                        disabled={s.isOccupiedInBatch}
                      >
                        Desk {s.seatNumber} {s.isOccupiedInBatch ? '❌ (Occupied in this batch)' : '✅ (Available)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Admin User Plan Selection (Mandatory!) */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Select Library Plan (Mandatory) *
                  </label>
                  {plans.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px]">
                      ⚠️ No library plans found. Please create plans in Student Plans menu first!
                    </div>
                  ) : (
                    <select
                      name="planId"
                      value={formData.planId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none"
                      required
                    >
                      {plans.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} — ₹{p.price} ({p.validity} {p.validityUnit})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Informational Note */}
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                💰 Enrolling student will allocate the seat in this batch, record the plan price as library <strong>Income</strong>, and send a WhatsApp confirmation pass.
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment & Allocate Seat'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <StudentDetailModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onGenerateIdCard={(student) => handleOpenIdCard(student)}
        onRenewPlan={(student) => setStudentToRenew(student)}
        onSendWhatsApp={(student) => setStudentToSendWhatsApp(student)}
      />

      <IDCardModal
        isOpen={!!idCardData}
        idCardData={idCardData}
        onClose={() => setIdCardData(null)}
      />

      <RenewPlanModal
        isOpen={!!studentToRenew}
        student={studentToRenew}
        onClose={() => setStudentToRenew(null)}
        onSuccess={fetchUsers}
      />

      <SendWhatsAppModal
        isOpen={!!studentToSendWhatsApp}
        student={studentToSendWhatsApp}
        onClose={() => setStudentToSendWhatsApp(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

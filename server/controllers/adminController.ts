import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types/index.js';
import { Admin } from '../models/Admin.js';
import { Branch } from '../models/Branch.js';
import { Manager } from '../models/Manager.js';
import { ManagerPermission } from '../models/ManagerPermission.js';
import { User } from '../models/User.js';
import { Seat } from '../models/Seat.js';
import { SeatAssignment } from '../models/SeatAssignment.js';
import { Batch } from '../models/Batch.js';
import { Plan } from '../models/Plan.js';
import { UserPlan } from '../models/UserPlan.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { PaymentConfig } from '../models/PaymentConfig.js';
import { Expense } from '../models/Expense.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { AuditLog } from '../models/AuditLog.js';
import { ReminderLog } from '../models/ReminderLog.js';
import {
  branchSchema,
  managerSchema,
  managerPermissionsSchema,
  seatSchema,
  userPlanSchema,
  createStudentSchema,
  renewPlanSchema,
  batchSchema,
  expenseSchema,
  queueEntrySchema,
  paymentConfigSchema,
  reviewPaymentSchema,
  submitPaymentSchema,
} from '../validators/index.js';
import { getAdminUsageStats, checkPlanLimit } from '../services/planLimitService.js';
import { calculateExpiryDate, getActiveAdminSubscription } from '../services/subscriptionService.js';
import { generateOrGetExpiryReminders } from '../services/reminderService.js';
import { sendWhatsAppAlert, WHATSAPP_TEMPLATES, buildWhatsAppLink } from '../services/whatsappService.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

function getAdminId(req: AuthenticatedRequest): Types.ObjectId {
  const idStr = req.user?.adminId || (req.user?.role === 'ADMIN' ? req.user.id : null);
  if (!idStr) throw new Error('Unauthenticated admin context');
  return new Types.ObjectId(idStr);
}

export function getDateRange(filter: string): { startDate: Date; endDate: Date; label: string } {
  const now = new Date();
  const endDate = new Date();
  let startDate = new Date();
  let label = 'This Month';

  switch (filter) {
    case 'today': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      label = 'Today';
      break;
    }
    case 'yesterday': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      endDate.setTime(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime());
      label = 'Yesterday';
      break;
    }
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      label = 'This Week';
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'This Month';
      break;
    }
    case 'last_6_months': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      label = 'Last 6 Months';
      break;
    }
    case 'this_year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      label = 'This Year';
      break;
    }
    case 'all_time': {
      startDate = new Date(0);
      label = 'All Time';
      break;
    }
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'This Month';
      break;
    }
  }

  return { startDate, endDate, label };
}

// 1. Dashboard Financials & Quotas
export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const filter = (req.query.filter as string) || 'this_month';
  const { startDate, endDate, label } = getDateRange(filter);

  const usageStats = await getAdminUsageStats(adminId);
  const admin = await Admin.findById(adminId);

  const [
    branchesCount,
    activeSeatsCount,
    totalSeatsCount,
    activeUsersCount,
    totalUsersCount,
    userPlansCount,
    pendingPaymentsCount,
    incomeAgg,
    expenseAgg,
  ] = await Promise.all([
    Branch.countDocuments({ adminId, status: 'ACTIVE' }),
    SeatAssignment.countDocuments({ adminId, status: 'ACTIVE' }),
    Seat.countDocuments({ adminId }),
    User.countDocuments({ adminId, entryStatus: 'ACTIVE' }),
    User.countDocuments({ adminId }),
    UserPlan.countDocuments({ adminId }),
    Payment.countDocuments({ adminId, type: 'USER_PLAN', status: 'PENDING' }),
    Payment.aggregate([
      {
        $match: {
          adminId,
          type: 'USER_PLAN',
          status: 'APPROVED',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      {
        $match: {
          adminId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalIncome = incomeAgg.length > 0 ? incomeAgg[0].total : 0;
  const totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].total : 0;
  const netRevenue = totalIncome - totalExpenses;

  // WhatsApp Alert Limit & Quota calculation
  const totalAlertsSent = await ReminderLog.countDocuments({ adminId });
  const maxAlertsAllowed = usageStats.messages?.max || 500;

  res.json({
    success: true,
    stats: {
      usageStats,
      branchesCount,
      activeSeatsCount,
      totalSeatsCount,
      activeUsersCount,
      totalUsersCount,
      userPlansCount,
      pendingPaymentsCount,
      financials: {
        filter,
        label,
        totalIncome,
        totalExpenses,
        netRevenue,
        startDate,
        endDate,
      },
      whatsappAlerts: {
        used: totalAlertsSent,
        limit: maxAlertsAllowed,
        remaining: Math.max(0, maxAlertsAllowed - totalAlertsSent),
      },
    },
  });
}

// 2. SaaS Plans (Admin buying from Super Admin)
export async function getAvailableSaaSPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const [plans, superAdminConfig, activeSub, pendingPayment] = await Promise.all([
    Plan.find({ isActive: true }).sort({ price: 1 }),
    PaymentConfig.findOne({ scope: 'SUPERADMIN' }),
    getActiveAdminSubscription(adminId),
    Payment.findOne({ adminId, type: 'SAAS_PLAN', status: 'PENDING' }).sort({ createdAt: -1 }),
  ]);

  let currentPlanId: string | null = null;
  let currentSubscription: any = null;

  if (activeSub) {
    currentPlanId = activeSub.planId ? activeSub.planId.toString() : null;
    currentSubscription = {
      _id: activeSub._id,
      planId: activeSub.planId,
      planName: activeSub.planSnapshot?.name,
      expiresAt: activeSub.expiresAt,
      status: activeSub.status,
    };
  }

  res.json({
    success: true,
    plans,
    currentPlanId,
    currentSubscription,
    pendingPayment,
    paymentConfig: superAdminConfig,
  });
}

export async function purchaseSaaSPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { planId, utr, screenshot } = submitPaymentSchema.parse(req.body);

  // 1. Block new payment if previous payment is still PENDING
  const existingPending = await Payment.findOne({
    adminId,
    type: 'SAAS_PLAN',
    status: 'PENDING',
  });

  if (existingPending) {
    res.status(400).json({
      success: false,
      code: 'PENDING_PAYMENT_EXISTS',
      message: 'You already have a payment request under verification. You cannot submit a new payment until the previous request is accepted or denied by Super Admin.',
      pendingPayment: existingPending,
    });
    return;
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    res.status(404).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'Subscription plan not found' });
    return;
  }

  // Check if UTR already submitted
  const existingPayment = await Payment.findOne({ utr, type: 'SAAS_PLAN' });
  if (existingPayment) {
    res.status(400).json({
      success: false,
      code: 'DUPLICATE_UTR',
      message: 'This UTR has already been submitted for verification.',
    });
    return;
  }

  const payment = await Payment.create({
    type: 'SAAS_PLAN',
    adminId,
    planId: plan._id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
    utr,
    screenshot,
    status: 'PENDING',
  });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    action: 'PLAN_PURCHASED',
    target: 'Payment',
    targetId: payment._id.toString(),
    metadata: { planName: plan.name, amount: plan.price, utr },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    message: 'Payment submitted for verification. Super Admin will review shortly.',
    payment,
  });
}

// 3. Batches / Session Timings
export async function getBatches(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const batches = await Batch.find({ adminId }).sort({ createdAt: 1 });
  res.json({ success: true, batches });
}

export async function createBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const data = batchSchema.parse(req.body);

  const existing = await Batch.findOne({ adminId, name: data.name.trim() });
  if (existing) {
    res.status(409).json({ success: false, code: 'BATCH_EXISTS', message: 'A batch with this name already exists' });
    return;
  }

  const batch = await Batch.create({
    adminId,
    name: data.name.trim(),
    startTime: data.startTime.trim(),
    endTime: data.endTime.trim(),
    description: data.description || '',
    branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
  });

  res.status(201).json({ success: true, batch });
}

export async function updateBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { batchId } = req.params;
  const data = batchSchema.partial().parse(req.body);

  const batch = await Batch.findOneAndUpdate({ _id: batchId, adminId }, data, { new: true });
  if (!batch) {
    res.status(404).json({ success: false, code: 'BATCH_NOT_FOUND', message: 'Batch not found' });
    return;
  }
  res.json({ success: true, batch });
}

export async function deleteBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { batchId } = req.params;

  const activeCount = await SeatAssignment.countDocuments({ batchId, status: 'ACTIVE' });
  if (activeCount > 0) {
    res.status(400).json({
      success: false,
      code: 'BATCH_IN_USE',
      message: `Cannot delete batch with ${activeCount} active assigned students. Reassign or remove them first.`,
    });
    return;
  }

  await Batch.findOneAndDelete({ _id: batchId, adminId });
  res.json({ success: true, message: 'Batch deleted successfully' });
}

// 4. Branches
export async function getBranches(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const branches = await Branch.find({ adminId }).sort({ createdAt: -1 });

  const branchesWithStats = await Promise.all(
    branches.map(async (b) => {
      const [seatCount, assignedSeatCount, userCount, manager] = await Promise.all([
        Seat.countDocuments({ branchId: b._id }),
        SeatAssignment.countDocuments({ branchId: b._id, status: 'ACTIVE' }),
        User.countDocuments({ branchId: b._id }),
        Manager.findOne({ branchId: b._id, status: 'ACTIVE' }).select('name email phone'),
      ]);
      return {
        ...b.toObject(),
        seatCount,
        assignedSeatCount,
        userCount,
        manager,
      };
    })
  );

  res.json({ success: true, branches: branchesWithStats });
}

export async function createBranch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const limitCheck = await checkPlanLimit(adminId, 'branches');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: limitCheck.message || 'Maximum branch limit reached for your plan.',
    });
    return;
  }

  const data = branchSchema.parse(req.body);
  const branch = await Branch.create({ ...data, adminId });

  res.status(201).json({ success: true, branch });
}

export async function updateBranch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { branchId } = req.params;
  const data = branchSchema.partial().parse(req.body);

  const branch = await Branch.findOneAndUpdate({ _id: branchId, adminId }, data, { new: true });
  if (!branch) {
    res.status(404).json({ success: false, code: 'BRANCH_NOT_FOUND', message: 'Branch not found' });
    return;
  }
  res.json({ success: true, branch });
}

export async function deleteBranch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { branchId } = req.params;

  const usersCount = await User.countDocuments({ branchId });
  if (usersCount > 0) {
    res.status(400).json({
      success: false,
      code: 'BRANCH_IN_USE',
      message: `Cannot delete branch with ${usersCount} assigned users. Reassign them first.`,
    });
    return;
  }

  await Branch.findOneAndDelete({ _id: branchId, adminId });
  res.json({ success: true, message: 'Branch deleted' });
}

// 5. Managers
export async function getManagers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const managers = await Manager.find({ adminId })
    .populate('branchId', 'name address')
    .select('-password')
    .sort({ createdAt: -1 });

  const managersWithPerms = await Promise.all(
    managers.map(async (m) => {
      const perms = await ManagerPermission.findOne({ managerId: m._id });
      return {
        ...m.toObject(),
        permissions: perms,
      };
    })
  );

  res.json({ success: true, managers: managersWithPerms });
}

export async function createManager(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const limitCheck = await checkPlanLimit(adminId, 'managers');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: limitCheck.message || 'Maximum manager limit reached for your plan.',
    });
    return;
  }

  const data = managerSchema.parse(req.body);
  const existing = await Manager.findOne({ email: data.email });
  if (existing) {
    res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'Email already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const manager = await Manager.create({
    adminId,
    branchId: new Types.ObjectId(data.branchId),
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    status: 'ACTIVE',
  });

  await ManagerPermission.create({
    managerId: manager._id,
    adminId,
    branchId: manager.branchId,
  });

  res.status(201).json({ success: true, manager: { ...manager.toObject(), password: undefined } });
}

export async function updateManagerPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { managerId } = req.params;
  const permissionsData = managerPermissionsSchema.parse(req.body);

  const manager = await Manager.findOne({ _id: managerId, adminId });
  if (!manager) {
    res.status(404).json({ success: false, code: 'MANAGER_NOT_FOUND', message: 'Manager not found' });
    return;
  }

  const updatedPerms = await ManagerPermission.findOneAndUpdate(
    { managerId: manager._id },
    { ...permissionsData, adminId, branchId: manager.branchId },
    { upsert: true, new: true }
  );

  res.json({ success: true, permissions: updatedPerms });
}

export async function deleteManager(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { managerId } = req.params;

  const manager = await Manager.findOneAndDelete({ _id: managerId, adminId });
  if (!manager) {
    res.status(404).json({ success: false, code: 'MANAGER_NOT_FOUND', message: 'Manager not found' });
    return;
  }

  await ManagerPermission.findOneAndDelete({ managerId: manager._id });
  res.json({ success: true, message: 'Manager removed' });
}

// 6. User Plans (Created by Admin for their Students)
export async function getUserPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const plans = await UserPlan.find({ adminId }).sort({ price: 1 });
  res.json({ success: true, plans });
}

export async function createUserPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const data = userPlanSchema.parse(req.body);

  const plan = await UserPlan.create({ ...data, adminId });
  res.status(201).json({ success: true, plan });
}

export async function updateUserPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { planId } = req.params;
  const data = userPlanSchema.partial().parse(req.body);

  const plan = await UserPlan.findOneAndUpdate({ _id: planId, adminId }, data, { new: true });
  if (!plan) {
    res.status(404).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    return;
  }

  res.json({ success: true, plan });
}

export async function deleteUserPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { planId } = req.params;

  await UserPlan.findOneAndDelete({ _id: planId, adminId });
  res.json({ success: true, message: 'User plan deleted' });
}

// 7. Seats (Batch-Wise Timing Logic)
export async function getSeats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const branchId = req.query.branchId as string;
  const search = (req.query.search as string || '').trim();

  const query: any = { adminId };
  if (branchId && Types.ObjectId.isValid(branchId)) {
    query.branchId = new Types.ObjectId(branchId);
  }
  if (search) {
    query.seatNumber = { $regex: search, $options: 'i' };
  }

  const seats = await Seat.find(query)
    .populate('branchId', 'name')
    .sort({ seatNumber: 1 });

  const seatIds = seats.map(s => s._id);

  // Fetch all active assignments across all batches
  const activeAssignments = await SeatAssignment.find({
    seatId: { $in: seatIds },
    status: 'ACTIVE',
  })
    .populate('batchId', 'name startTime endTime')
    .populate('userId', 'name phone photo classCourse parentName parentPhone entryStatus planEndDate idCardNumber');

  const seatsWithBatches = seats.map(seat => {
    const assignments = activeAssignments.filter(a => a.seatId.toString() === seat._id.toString());
    return {
      ...seat.toObject(),
      activeAssignments: assignments,
      isOccupied: assignments.length > 0,
      occupiedBatchCount: assignments.length,
    };
  });

  res.json({ success: true, seats: seatsWithBatches });
}

// Get all batch details & students assigned to a particular seat
export async function getSeatBatchDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { seatId } = req.params;

  const seat = await Seat.findOne({ _id: seatId, adminId }).populate('branchId', 'name address');
  if (!seat) {
    res.status(404).json({ success: false, code: 'SEAT_NOT_FOUND', message: 'Seat not found' });
    return;
  }

  const batches = await Batch.find({ adminId, isActive: true }).sort({ name: 1 });
  const assignments = await SeatAssignment.find({ seatId: seat._id, status: 'ACTIVE' })
    .populate('batchId')
    .populate({
      path: 'userId',
      populate: { path: 'currentPlan', select: 'name price validity validityUnit' },
    });

  const batchMap = batches.map(batch => {
    const assignment = assignments.find(a => (a.batchId as any)?._id?.toString() === batch._id.toString());
    return {
      batch,
      isOccupied: !!assignment,
      assignment: assignment || null,
      student: assignment ? assignment.userId : null,
    };
  });

  res.json({
    success: true,
    seat,
    batches: batchMap,
  });
}

export async function createSeat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const limitCheck = await checkPlanLimit(adminId, 'seats');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: limitCheck.message || 'Maximum seat limit reached for your plan.',
    });
    return;
  }

  const data = seatSchema.parse(req.body);
  const branch = await Branch.findOne({ _id: data.branchId, adminId });
  if (!branch) {
    res.status(400).json({ success: false, code: 'INVALID_BRANCH', message: 'Branch not found' });
    return;
  }

  const existingSeat = await Seat.findOne({ branchId: branch._id, seatNumber: data.seatNumber.trim() });
  if (existingSeat) {
    res.status(409).json({ success: false, code: 'SEAT_EXISTS', message: 'A seat with this number already exists in this branch' });
    return;
  }

  const seat = await Seat.create({
    adminId,
    branchId: branch._id,
    seatNumber: data.seatNumber.trim().toUpperCase(),
    status: 'AVAILABLE',
  });

  res.status(201).json({ success: true, seat });
}

export async function deleteSeat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { seatId } = req.params;

  const activeAssignments = await SeatAssignment.countDocuments({ seatId, status: 'ACTIVE' });
  if (activeAssignments > 0) {
    res.status(400).json({
      success: false,
      code: 'SEAT_IN_USE',
      message: `Cannot delete seat with ${activeAssignments} active student assignment(s). Reassign them first.`,
    });
    return;
  }

  await Seat.findOneAndDelete({ _id: seatId, adminId });
  res.json({ success: true, message: 'Seat deleted' });
}

// 8. Users / Students (Admin adding without user creds, with batch, seat & plan)
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const search = (req.query.search as string || '').trim();
  const filter = (req.query.filter as string || 'all').toLowerCase();
  const branchId = req.query.branchId as string;

  const query: any = { adminId };
  if (branchId && Types.ObjectId.isValid(branchId)) {
    query.branchId = new Types.ObjectId(branchId);
  }

  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Filters: All user, plan expired user, plan about to expire user (< 5 days remaining)
  if (filter === 'expiring_soon') {
    query.planEndDate = { $gte: now, $lte: fiveDaysFromNow };
    query.entryStatus = { $ne: 'EXPIRED' };
  } else if (filter === 'expired') {
    query.$or = [
      { planEndDate: { $lt: now } },
      { entryStatus: 'EXPIRED' },
    ];
  } else if (filter === 'active') {
    query.planEndDate = { $gt: now };
    query.entryStatus = 'ACTIVE';
  }

  if (search) {
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { parentName: { $regex: search, $options: 'i' } },
          { parentPhone: { $regex: search, $options: 'i' } },
          { classCourse: { $regex: search, $options: 'i' } },
          { idCardNumber: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  const [users, total, counts] = await Promise.all([
    User.find(query)
      .populate('branchId', 'name address')
      .populate('batchId', 'name startTime endTime')
      .populate('currentSeat', 'seatNumber')
      .populate('currentPlan', 'name price validity validityUnit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password'),
    User.countDocuments(query),
    Promise.all([
      User.countDocuments({ adminId }),
      User.countDocuments({ adminId, planEndDate: { $gt: now }, entryStatus: 'ACTIVE' }),
      User.countDocuments({ adminId, planEndDate: { $gte: now, $lte: fiveDaysFromNow }, entryStatus: { $ne: 'EXPIRED' } }),
      User.countDocuments({ adminId, $or: [{ planEndDate: { $lt: now } }, { entryStatus: 'EXPIRED' }] }),
    ]),
  ]);

  const [totalAll, totalActive, totalExpiringSoon, totalExpired] = counts;

  const usersWithDaysRemaining = users.map(u => {
    const expiry = u.planEndDate ? new Date(u.planEndDate) : null;
    let daysRemaining = 0;
    let isExpired = false;
    let isExpiringSoon = false;

    if (expiry) {
      const diffMs = expiry.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0 || u.entryStatus === 'EXPIRED') {
        isExpired = true;
      } else if (daysRemaining <= 5) {
        isExpiringSoon = true;
      }
    }

    return {
      ...u.toObject(),
      daysRemaining,
      isExpired,
      isExpiringSoon,
    };
  });

  res.json({
    success: true,
    users: usersWithDaysRemaining,
    counts: {
      all: totalAll,
      active: totalActive,
      expiring_soon: totalExpiringSoon,
      expired: totalExpired,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// Admin adding student with required details, batch timing, seat and plan
export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const limitCheck = await checkPlanLimit(adminId, 'users');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: limitCheck.message || 'Maximum student limit reached for your plan.',
    });
    return;
  }

  const data = createStudentSchema.parse(req.body);

  // 1. Phone number must be unique per admin
  const existingPhone = await User.findOne({ adminId, phone: data.phone.trim() });
  if (existingPhone) {
    res.status(409).json({
      success: false,
      code: 'PHONE_EXISTS',
      message: `A student with phone number ${data.phone} already exists in your library.`,
    });
    return;
  }

  // 2. Validate Branch
  const branch = await Branch.findOne({ _id: data.branchId, adminId });
  if (!branch) {
    res.status(400).json({ success: false, code: 'INVALID_BRANCH', message: 'Selected branch not found.' });
    return;
  }

  // 3. Validate Batch
  const batch = await Batch.findOne({ _id: data.batchId, adminId });
  if (!batch) {
    res.status(400).json({ success: false, code: 'INVALID_BATCH', message: 'Selected session batch not found.' });
    return;
  }

  // 4. Validate Seat
  const seat = await Seat.findOne({ _id: data.seatId, adminId });
  if (!seat) {
    res.status(400).json({ success: false, code: 'INVALID_SEAT', message: 'Selected seat not found.' });
    return;
  }

  // 5. Timing-based check: One seat CANNOT be assigned to multiple users in the SAME batch!
  const existingSeatInBatch = await SeatAssignment.findOne({
    seatId: seat._id,
    batchId: batch._id,
    status: 'ACTIVE',
  });

  if (existingSeatInBatch) {
    res.status(400).json({
      success: false,
      code: 'SEAT_ALREADY_ASSIGNED_IN_BATCH',
      message: `Seat ${seat.seatNumber} is already occupied in ${batch.name}. A seat cannot be given to multiple students in the same batch. Please pick another seat or batch.`,
    });
    return;
  }

  // 6. Validate Admin UserPlan
  const plan = await UserPlan.findOne({ _id: data.planId, adminId });
  if (!plan) {
    res.status(400).json({ success: false, code: 'INVALID_PLAN', message: 'Selected library plan not found.' });
    return;
  }

  // Calculate validity dates
  const planStartDate = new Date();
  const planEndDate = calculateExpiryDate(plan.validity, plan.validityUnit, planStartDate);
  const idCardNumber = `LIB-${Date.now().toString().slice(-6)}`;

  // Create User
  const user = await User.create({
    adminId,
    branchId: branch._id,
    batchId: batch._id,
    currentSeat: seat._id,
    currentPlan: plan._id,
    name: data.name,
    phone: data.phone,
    whatsappNumber: data.phone,
    classCourse: data.classCourse || '',
    address: data.address || '',
    photo: data.photo || '',
    parentName: data.parentName,
    parentPhone: data.parentPhone,
    aadharNumber: data.aadharNumber || '',
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    gender: data.gender || 'Male',
    email: data.email || undefined,
    planStartDate,
    planEndDate,
    idCardNumber,
    entryStatus: 'ACTIVE',
  });

  // Create active SeatAssignment with batch
  await SeatAssignment.create({
    adminId,
    branchId: branch._id,
    seatId: seat._id,
    batchId: batch._id,
    userId: user._id,
    startDate: planStartDate,
    endDate: planEndDate,
    status: 'ACTIVE',
    assignedBy: new Types.ObjectId(req.user!.id),
    assignedByRole: req.user!.role,
    notes: `Enrolled under ${plan.name} in ${batch.name}`,
  });

  // Update seat status
  await Seat.findByIdAndUpdate(seat._id, { status: 'ASSIGNED' });

  // Record income: when user created with a plan, consider the amount of this plan as INCOME!
  const payment = await Payment.create({
    type: 'USER_PLAN',
    adminId,
    userId: user._id,
    planId: plan._id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency || 'INR',
    utr: `ADM-${Date.now().toString().slice(-8)}`,
    status: 'APPROVED',
    reviewedBy: new Types.ObjectId(req.user!.id),
    reviewedByRole: req.user!.role,
    reviewedAt: new Date(),
    submittedAt: new Date(),
  });

  // Try optional WhatsApp admission notice (if quota permits)
  try {
    await sendWhatsAppAlert({
      adminId,
      user,
      templateKey: 'ADMISSION_WELCOME',
      variables: {
        seatNumber: seat.seatNumber,
        batchName: batch.name,
        planName: plan.name,
      },
      sentBy: 'ADMIN',
    });
  } catch (waErr: any) {
    console.log('ℹ️ [WhatsApp] Welcome notification quota notice:', waErr.message);
  }

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: branch._id,
    action: 'USER_CREATED',
    target: 'User',
    targetId: user._id.toString(),
    metadata: { name: user.name, seat: seat.seatNumber, batch: batch.name, planPrice: plan.price },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    message: 'Student created successfully with assigned seat and plan!',
    user,
    payment,
  });
}

// Renew student's plan & record as INCOME
export async function renewUserPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { userId } = req.params;
  const { planId, paymentMode, notes } = renewPlanSchema.parse(req.body);

  const user = await User.findOne({ _id: userId, adminId });
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'Student record not found.' });
    return;
  }

  const plan = await UserPlan.findOne({ _id: planId, adminId });
  if (!plan) {
    res.status(404).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'Library plan not found.' });
    return;
  }

  const now = new Date();
  let baseDate = now;
  if (user.planEndDate && new Date(user.planEndDate) > now) {
    baseDate = new Date(user.planEndDate);
  }

  const newEndDate = calculateExpiryDate(plan.validity, plan.validityUnit, baseDate);

  user.currentPlan = plan._id;
  user.planEndDate = newEndDate;
  user.entryStatus = 'ACTIVE';
  user.whatsappRemindersSent = undefined; // Reset for next expiry cycle
  await user.save();

  // Extend active seat assignments
  if (user.currentSeat) {
    await SeatAssignment.updateMany(
      { userId: user._id, status: 'ACTIVE' },
      { $set: { endDate: newEndDate } }
    );
  }

  // Record plan renewal as INCOME
  const payment = await Payment.create({
    type: 'USER_PLAN',
    adminId,
    userId: user._id,
    planId: plan._id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency || 'INR',
    utr: `RNW-${Date.now().toString().slice(-8)}`,
    status: 'APPROVED',
    reviewedBy: new Types.ObjectId(req.user!.id),
    reviewedByRole: req.user!.role,
    reviewedAt: new Date(),
    submittedAt: new Date(),
  });

  // Try WhatsApp renewal alert
  try {
    const seat = user.currentSeat ? await Seat.findById(user.currentSeat) : null;
    const batch = user.batchId ? await Batch.findById(user.batchId) : null;
    await sendWhatsAppAlert({
      adminId,
      user,
      templateKey: 'PLAN_RENEWED',
      variables: {
        seatNumber: seat?.seatNumber,
        batchName: batch?.name,
        planName: plan.name,
      },
      sentBy: 'ADMIN',
    });
  } catch (waErr: any) {
    console.log('ℹ️ [WhatsApp] Renewal notification quota notice:', waErr.message);
  }

  res.json({
    success: true,
    message: `Plan renewed successfully until ${newEndDate.toLocaleDateString()}. Recorded ₹${plan.price} in library income!`,
    user,
    payment,
  });
}

// Student ID Card Generation
export async function getStudentIdCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { userId } = req.params;

  const [admin, user] = await Promise.all([
    Admin.findById(adminId),
    User.findOne({ _id: userId, adminId })
      .populate('branchId')
      .populate('batchId')
      .populate('currentSeat')
      .populate('currentPlan'),
  ]);

  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'Student not found.' });
    return;
  }

  const branch = user.branchId as any;

  res.json({
    success: true,
    idCard: {
      student: {
        id: user._id,
        idCardNumber: user.idCardNumber || `LIB-${user._id.toString().slice(-6).toUpperCase()}`,
        name: user.name,
        phone: user.phone,
        classCourse: user.classCourse || 'General Reading',
        address: user.address,
        photo: user.photo,
        parentName: user.parentName,
        parentPhone: user.parentPhone,
        aadharNumber: user.aadharNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        planName: (user.currentPlan as any)?.name || 'Standard Plan',
        planStartDate: user.planStartDate || user.createdAt,
        planEndDate: user.planEndDate,
      },
      library: {
        organizationName: admin?.organizationName || 'Study Reading Library',
        phone: admin?.phone,
        email: admin?.email,
        whatsappNumber: admin?.whatsappNumber,
        branchName: branch?.name || 'Main Campus',
        branchAddress: branch?.address || '',
        branchPhone: branch?.phone || admin?.phone,
        branchEmail: branch?.email || admin?.email,
      },
      seat: {
        seatNumber: (user.currentSeat as any)?.seatNumber || 'Unassigned',
      },
      batch: {
        name: (user.batchId as any)?.name || 'Full Day',
        timing: (user.batchId as any) ? `${(user.batchId as any).startTime} - ${(user.batchId as any).endTime}` : 'Flexible',
      },
    },
  });
}

// WhatsApp Templates & Sender
export async function getWhatsAppTemplates(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ success: true, templates: Object.values(WHATSAPP_TEMPLATES) });
}

export async function sendManualWhatsApp(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { userId, templateKey, customMessage } = req.body;

  const user = await User.findOne({ _id: userId, adminId })
    .populate('currentSeat')
    .populate('batchId')
    .populate('currentPlan');

  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'Student not found.' });
    return;
  }

  try {
    const result = await sendWhatsAppAlert({
      adminId,
      user,
      templateKey: templateKey || 'CUSTOM',
      variables: { customMessage },
      sentBy: 'ADMIN',
    });

    res.json({
      ...result,
      message: 'WhatsApp alert recorded and ready to send.',
    });
  } catch (err: any) {
    res.status(403).json({
      success: false,
      code: 'QUOTA_EXCEEDED',
      message: err.message || 'WhatsApp alert quota exceeded. Please upgrade your SaaS plan.',
    });
  }
}

export async function updateUserEntryStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { userId } = req.params;
  const { entryStatus } = req.body;

  if (!['NONE', 'QUEUE', 'ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(entryStatus)) {
    res.status(400).json({ success: false, code: 'INVALID_STATUS', message: 'Invalid entry status' });
    return;
  }

  const user = await User.findOneAndUpdate({ _id: userId, adminId }, { entryStatus }, { new: true }).select('-password');
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  res.json({ success: true, user });
}

// 9. Queue System
export async function getQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const branchId = req.query.branchId as string;

  const query: any = { adminId, status: 'WAITING' };
  if (branchId && Types.ObjectId.isValid(branchId)) {
    query.branchId = new Types.ObjectId(branchId);
  }

  const queue = await QueueEntry.find(query)
    .populate('userId', 'name phone whatsappNumber classCourse')
    .populate('branchId', 'name')
    .sort({ priority: -1, createdAt: 1 });

  res.json({ success: true, queue });
}

export async function addToQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const limitCheck = await checkPlanLimit(adminId, 'queue');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: limitCheck.message || 'Queue capacity reached for your current plan.',
    });
    return;
  }

  const data = queueEntrySchema.parse(req.body);

  const user = await User.findOne({ _id: data.userId, adminId });
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  const queueEntry = await QueueEntry.create({
    adminId,
    branchId: new Types.ObjectId(data.branchId),
    userId: user._id,
    priority: data.priority,
    notes: data.notes,
    status: 'WAITING',
    addedBy: new Types.ObjectId(req.user!.id),
    addedByRole: req.user!.role,
  });

  res.status(201).json({ success: true, queueEntry });
}

export async function promoteQueueUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { queueId } = req.params;

  const entry = await QueueEntry.findOne({ _id: queueId, adminId });
  if (!entry) {
    res.status(404).json({ success: false, code: 'QUEUE_NOT_FOUND', message: 'Queue item not found' });
    return;
  }

  entry.status = 'PROMOTED';
  entry.promotedAt = new Date();
  await entry.save();

  await User.findByIdAndUpdate(entry.userId, { entryStatus: 'ACTIVE' });

  res.json({ success: true, message: 'User promoted successfully', entry });
}

export async function removeFromQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { queueId } = req.params;

  const entry = await QueueEntry.findOne({ _id: queueId, adminId });
  if (!entry) {
    res.status(404).json({ success: false, code: 'QUEUE_NOT_FOUND', message: 'Queue item not found' });
    return;
  }

  entry.status = 'REMOVED';
  await entry.save();

  res.json({ success: true, message: 'Removed from queue' });
}

// 10. Expenses
export async function getExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const branchId = req.query.branchId as string;

  const query: any = { adminId };
  if (branchId && Types.ObjectId.isValid(branchId)) {
    query.branchId = new Types.ObjectId(branchId);
  }

  const expenses = await Expense.find(query)
    .populate('branchId', 'name')
    .sort({ date: -1 })
    .limit(100);

  const totalAmountAgg = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.json({
    success: true,
    expenses,
    totalExpenses: totalAmountAgg.length > 0 ? totalAmountAgg[0].total : 0,
  });
}

export async function createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const data = expenseSchema.parse(req.body);

  const branch = await Branch.findOne({ _id: data.branchId, adminId });
  if (!branch) {
    res.status(400).json({ success: false, code: 'INVALID_BRANCH', message: 'Branch not found' });
    return;
  }

  const expense = await Expense.create({
    adminId,
    branchId: branch._id,
    title: data.title,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    category: data.category,
    recordedBy: new Types.ObjectId(req.user!.id),
    recordedByRole: req.user!.role,
  });

  res.status(201).json({ success: true, expense });
}

// 11. Payments & Reviews
export async function getPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const status = req.query.status as string;

  const query: any = { adminId, type: 'USER_PLAN' };
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate('userId', 'name phone whatsappNumber classCourse')
    .sort({ createdAt: -1 });

  res.json({ success: true, payments });
}

export async function reviewPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { paymentId } = req.params;
  const { action, rejectionReason } = reviewPaymentSchema.parse(req.body);

  const payment = await Payment.findOne({ _id: paymentId, adminId, type: 'USER_PLAN' });
  if (!payment) {
    res.status(404).json({ success: false, code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' });
    return;
  }

  if (payment.status !== 'PENDING') {
    res.status(400).json({ success: false, code: 'ALREADY_REVIEWED', message: `Payment already ${payment.status}` });
    return;
  }

  payment.reviewedBy = new Types.ObjectId(req.user!.id);
  payment.reviewedByRole = req.user!.role;
  payment.reviewedAt = new Date();

  if (action === 'APPROVE') {
    payment.status = 'APPROVED';
    await payment.save();

    const plan = await UserPlan.findById(payment.planId);
    if (plan && payment.userId) {
      const startDate = new Date();
      const expiresAt = calculateExpiryDate(plan.validity, plan.validityUnit, startDate);

      await User.findByIdAndUpdate(payment.userId, {
        currentPlan: plan._id,
        planStartDate: startDate,
        planEndDate: expiresAt,
        entryStatus: 'ACTIVE',
      });
    }

    res.json({ success: true, message: 'User payment approved and membership activated', payment });
  } else {
    payment.status = 'REJECTED';
    payment.rejectionReason = rejectionReason || 'Payment verification failed';
    await payment.save();

    res.json({ success: true, message: 'Payment rejected', payment });
  }
}

// 12. Payment Config
export async function getPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const config = await PaymentConfig.findOne({ scope: 'ADMIN', adminId });
  res.json({ success: true, config });
}

export async function updatePaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const data = paymentConfigSchema.parse(req.body);

  const config = await PaymentConfig.findOneAndUpdate(
    { scope: 'ADMIN', adminId },
    { ...data, scope: 'ADMIN', adminId },
    { upsert: true, new: true }
  );

  res.json({ success: true, config });
}

// 13. WhatsApp Expiry Reminders
export async function getWhatsAppReminders(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const reminders = await generateOrGetExpiryReminders(adminId);
  res.json({ success: true, reminders });
}

export async function markReminderOpened(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { reminderId } = req.params;

  const log = await ReminderLog.findOneAndUpdate(
    { _id: reminderId, adminId },
    { status: 'OPENED', openedAt: new Date() },
    { new: true }
  );

  res.json({ success: true, log });
}

// 14. Audit Logs
export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);

  const [logs, total] = await Promise.all([
    AuditLog.find({ adminId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments({ adminId }),
  ]);

  res.json({
    success: true,
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

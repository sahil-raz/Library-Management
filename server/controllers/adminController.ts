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
  assignSeatSchema,
  userPlanSchema,
  userRegisterSchema,
  expenseSchema,
  queueEntrySchema,
  paymentConfigSchema,
  reviewPaymentSchema,
  submitPaymentSchema,
} from '../validators/index.js';
import { getAdminUsageStats, checkPlanLimit } from '../services/planLimitService.js';
import { calculateExpiryDate, getActiveAdminSubscription } from '../services/subscriptionService.js';
import { generateOrGetExpiryReminders, buildWhatsAppLink } from '../services/reminderService.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

function getAdminId(req: AuthenticatedRequest): Types.ObjectId {
  const idStr = req.user?.adminId || (req.user?.role === 'ADMIN' ? req.user.id : null);
  if (!idStr) throw new Error('Unauthenticated admin context');
  return new Types.ObjectId(idStr);
}

// 1. Dashboard
export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const usageStats = await getAdminUsageStats(adminId);

  const [
    branchesCount,
    activeSeatsCount,
    totalSeatsCount,
    activeUsersCount,
    totalUsersCount,
    userPlansCount,
    pendingPaymentsCount,
    todayExpensesAgg,
  ] = await Promise.all([
    Branch.countDocuments({ adminId, status: 'ACTIVE' }),
    Seat.countDocuments({ adminId, status: 'ASSIGNED' }),
    Seat.countDocuments({ adminId }),
    User.countDocuments({ adminId, entryStatus: 'ACTIVE' }),
    User.countDocuments({ adminId }),
    UserPlan.countDocuments({ adminId }),
    Payment.countDocuments({ adminId, type: 'USER_PLAN', status: 'PENDING' }),
    Expense.aggregate([
      {
        $match: {
          adminId,
          date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const todayExpense = todayExpensesAgg.length > 0 ? todayExpensesAgg[0].total : 0;

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
      todayExpense,
    },
  });
}

// 2. SaaS Plans (Admin buying from Super Admin)
export async function getAvailableSaaSPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const [plans, superAdminConfig, activeSub] = await Promise.all([
    Plan.find({ isActive: true }).sort({ price: 1 }),
    PaymentConfig.findOne({ scope: 'SUPERADMIN' }),
    getActiveAdminSubscription(adminId),
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
    paymentConfig: superAdminConfig,
  });
}

export async function purchaseSaaSPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { planId, utr, screenshot } = submitPaymentSchema.parse(req.body);

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

// 3. Branches
export async function getBranches(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const branches = await Branch.find({ adminId }).sort({ createdAt: -1 });

  // Get seat counts and active users per branch
  const branchesWithStats = await Promise.all(
    branches.map(async (b) => {
      const [seatCount, assignedSeatCount, userCount, manager] = await Promise.all([
        Seat.countDocuments({ branchId: b._id }),
        Seat.countDocuments({ branchId: b._id, status: 'ASSIGNED' }),
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

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: branch._id,
    action: 'BRANCH_CREATED',
    target: 'Branch',
    targetId: branch._id.toString(),
    metadata: { name: branch.name },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

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

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: branch._id,
    action: 'BRANCH_UPDATED',
    target: 'Branch',
    targetId: branch._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

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

// 4. Managers
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

  // Check branch belongs to this admin
  const branch = await Branch.findOne({ _id: data.branchId, adminId });
  if (!branch) {
    res.status(400).json({ success: false, code: 'INVALID_BRANCH', message: 'Invalid branch ID' });
    return;
  }

  const existingEmail = await Manager.findOne({ email: data.email });
  if (existingEmail) {
    res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'Email already registered' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const manager = await Manager.create({
    adminId,
    branchId: branch._id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    status: 'ACTIVE',
  });

  // Create default manager permissions
  const permissions = await ManagerPermission.create({
    managerId: manager._id,
    adminId,
    branchId: branch._id,
    users_view: true,
    users_create: true,
    users_edit: false,
    seats_view: true,
    seats_assign: true,
    queue_manage: true,
    entries_manage: true,
    payments_view: true,
    expenses_manage: false,
    expenses_add: true,
    expenses_view: true,
    reminders_send: true,
    dashboard_view: true,
  });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: branch._id,
    action: 'MANAGER_CREATED',
    target: 'Manager',
    targetId: manager._id.toString(),
    metadata: { name: manager.name, email: manager.email },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    manager: { ...manager.toObject(), password: undefined },
    permissions,
  });
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

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: manager.branchId,
    action: 'PERMISSION_CHANGED',
    target: 'ManagerPermission',
    targetId: manager._id.toString(),
    metadata: permissionsData,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

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

// 5. User Plans
export async function getUserPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const plans = await UserPlan.find({ adminId }).sort({ price: 1 });
  res.json({ success: true, plans });
}

export async function createUserPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const data = userPlanSchema.parse(req.body);

  const plan = await UserPlan.create({ ...data, adminId });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    action: 'PLAN_CREATED',
    target: 'UserPlan',
    targetId: plan._id.toString(),
    metadata: { name: plan.name, price: plan.price },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

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

// 6. Seats
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
    .populate('assignedUserId', 'name email phone whatsappNumber')
    .sort({ seatNumber: 1 });

  res.json({ success: true, seats });
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

  const seat = await Seat.create({
    adminId,
    branchId: branch._id,
    seatNumber: data.seatNumber,
    status: 'AVAILABLE',
  });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: branch._id,
    action: 'SEAT_CREATED',
    target: 'Seat',
    targetId: seat._id.toString(),
    metadata: { seatNumber: seat.seatNumber },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({ success: true, seat });
}

export async function assignSeat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const data = assignSeatSchema.parse(req.body);

  const seat = await Seat.findOne({ _id: data.seatId, adminId });
  if (!seat) {
    res.status(404).json({ success: false, code: 'SEAT_NOT_FOUND', message: 'Seat not found' });
    return;
  }

  const user = await User.findOne({ _id: data.userId, adminId });
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  // Update seat
  seat.status = 'ASSIGNED';
  seat.assignedUserId = user._id;
  seat.assignedFrom = new Date(data.startDate);
  seat.assignedUntil = new Date(data.endDate);
  await seat.save();

  // Update user
  user.currentSeat = seat._id;
  user.entryStatus = 'ACTIVE';
  await user.save();

  // Create seat assignment history
  const assignment = await SeatAssignment.create({
    adminId,
    branchId: seat.branchId,
    seatId: seat._id,
    userId: user._id,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: 'ACTIVE',
    assignedBy: new Types.ObjectId(req.user!.id),
    assignedByRole: req.user!.role,
    notes: data.notes,
  });

  await createNotification({
    recipientRole: 'USER',
    recipientId: user._id,
    title: 'Seat Assigned',
    message: `Seat ${seat.seatNumber} has been allocated to you until ${new Date(data.endDate).toLocaleDateString()}.`,
    type: 'SEAT',
  });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: seat.branchId,
    action: 'SEAT_ASSIGNED',
    target: 'Seat',
    targetId: seat._id.toString(),
    metadata: { seatNumber: seat.seatNumber, userName: user.name, endDate: data.endDate },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, message: 'Seat assigned successfully', seat, assignment });
}

export async function unassignSeat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { seatId } = req.params;

  const seat = await Seat.findOne({ _id: seatId, adminId });
  if (!seat) {
    res.status(404).json({ success: false, code: 'SEAT_NOT_FOUND', message: 'Seat not found' });
    return;
  }

  const previousUserId = seat.assignedUserId;

  seat.status = 'AVAILABLE';
  seat.assignedUserId = undefined;
  seat.assignedFrom = undefined;
  seat.assignedUntil = undefined;
  await seat.save();

  if (previousUserId) {
    await User.findByIdAndUpdate(previousUserId, { $unset: { currentSeat: 1 } });
    await SeatAssignment.updateMany(
      { seatId: seat._id, userId: previousUserId, status: 'ACTIVE' },
      { status: 'RELEASED' }
    );

    await createNotification({
      recipientRole: 'USER',
      recipientId: previousUserId,
      title: 'Seat Released',
      message: `Your seat ${seat.seatNumber} has been released.`,
      type: 'SEAT',
    });
  }

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: seat.branchId,
    action: 'SEAT_UNASSIGNED',
    target: 'Seat',
    targetId: seat._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, message: 'Seat released', seat });
}

export async function deleteSeat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const { seatId } = req.params;

  await Seat.findOneAndDelete({ _id: seatId, adminId });
  res.json({ success: true, message: 'Seat deleted' });
}

// 7. Users
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const search = (req.query.search as string || '').trim();
  const entryStatus = req.query.entryStatus as string;
  const branchId = req.query.branchId as string;

  const query: any = { adminId };
  if (entryStatus) query.entryStatus = entryStatus;
  if (branchId && Types.ObjectId.isValid(branchId)) query.branchId = new Types.ObjectId(branchId);
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('branchId', 'name')
      .populate('currentSeat', 'seatNumber')
      .populate('currentSubscription')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password'),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const limitCheck = await checkPlanLimit(adminId, 'users');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: limitCheck.message || 'Maximum user limit reached for your plan.',
    });
    return;
  }

  const data = userRegisterSchema.parse({ ...req.body, adminId: adminId.toString() });

  const existing = await User.findOne({ adminId, email: data.email });
  if (existing) {
    res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = await User.create({
    adminId,
    branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
    name: data.name,
    email: data.email,
    phone: data.phone,
    whatsappNumber: data.whatsappNumber,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    address: data.address,
    emergencyContact: data.emergencyContact,
    password: hashedPassword,
    entryStatus: 'ACTIVE',
  });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: user.branchId,
    action: 'USER_CREATED',
    target: 'User',
    targetId: user._id.toString(),
    metadata: { name: user.name },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
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

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    action: 'USER_UPDATED',
    target: 'User',
    targetId: user._id.toString(),
    metadata: { entryStatus },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, user });
}

// 8. Queue System
export async function getQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const branchId = req.query.branchId as string;

  const query: any = { adminId, status: 'WAITING' };
  if (branchId && Types.ObjectId.isValid(branchId)) {
    query.branchId = new Types.ObjectId(branchId);
  }

  const queue = await QueueEntry.find(query)
    .populate('userId', 'name email phone whatsappNumber')
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

  user.entryStatus = 'QUEUE';
  await user.save();

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: queueEntry.branchId,
    action: 'QUEUE_ADDED',
    target: 'QueueEntry',
    targetId: queueEntry._id.toString(),
    metadata: { userName: user.name },
    ip: req.ip,
    userAgent: req.get('user-agent'),
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

  await createNotification({
    recipientRole: 'USER',
    recipientId: entry.userId,
    title: 'Promoted from Queue!',
    message: 'Your turn has arrived! Your entry status is now active.',
    type: 'QUEUE',
  });

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: entry.branchId,
    action: 'QUEUE_PROMOTED',
    target: 'QueueEntry',
    targetId: entry._id.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

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

  await User.findByIdAndUpdate(entry.userId, { entryStatus: 'NONE' });

  res.json({ success: true, message: 'Removed from queue' });
}

// 9. Expenses
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

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId,
    branchId: branch._id,
    action: 'EXPENSE_CREATED',
    target: 'Expense',
    targetId: expense._id.toString(),
    metadata: { title: expense.title, amount: expense.amount },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({ success: true, expense });
}

// 10. Patron Payments
export async function getPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getAdminId(req);
  const status = req.query.status as string;

  const query: any = { adminId, type: 'USER_PLAN' };
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate('userId', 'name email phone whatsappNumber')
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
    if (!plan) {
      res.status(400).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'Referenced user plan not found' });
      return;
    }

    const startDate = new Date();
    const expiresAt = calculateExpiryDate(plan.validity, plan.validityUnit, startDate);

    const subscription = await Subscription.create({
      type: 'LIBRARY_USER',
      adminId,
      userId: payment.userId,
      planId: plan._id,
      planSnapshot: {
        name: plan.name,
        price: plan.price,
        validity: plan.validity,
        validityUnit: plan.validityUnit,
      },
      startDate,
      expiresAt,
      status: 'ACTIVE',
      paymentId: payment._id,
    });

    if (payment.userId) {
      await User.findByIdAndUpdate(payment.userId, {
        currentSubscription: subscription._id,
        entryStatus: 'ACTIVE',
      });

      await createNotification({
        recipientRole: 'USER',
        recipientId: payment.userId,
        title: 'Subscription Activated! 🎉',
        message: `Your payment of ₹${payment.amount} for "${plan.name}" has been approved. Valid until ${expiresAt.toLocaleDateString()}.`,
        type: 'PAYMENT',
      });
    }

    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      actorName: req.user!.name,
      adminId,
      action: 'PAYMENT_APPROVED',
      target: 'Payment',
      targetId: payment._id.toString(),
      metadata: { amount: payment.amount, expiresAt },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'User payment approved and membership activated', payment, subscription });
  } else {
    payment.status = 'REJECTED';
    payment.rejectionReason = rejectionReason || 'Payment verification failed';
    await payment.save();

    if (payment.userId) {
      await createNotification({
        recipientRole: 'USER',
        recipientId: payment.userId,
        title: 'Payment Rejected',
        message: `Your payment of ₹${payment.amount} was rejected: ${payment.rejectionReason}`,
        type: 'PAYMENT',
      });
    }

    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      actorName: req.user!.name,
      adminId,
      action: 'PAYMENT_REJECTED',
      target: 'Payment',
      targetId: payment._id.toString(),
      metadata: { reason: payment.rejectionReason },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Payment rejected', payment });
  }
}

// 11. Payment Config
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

// 12. WhatsApp Expiry Reminders
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

// 13. Audit Logs
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

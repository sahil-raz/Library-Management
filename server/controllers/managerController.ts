import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types/index.js';
import { User } from '../models/User.js';
import { Seat } from '../models/Seat.js';
import { SeatAssignment } from '../models/SeatAssignment.js';
import { Expense } from '../models/Expense.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { Branch } from '../models/Branch.js';
import { ManagerPermission } from '../models/ManagerPermission.js';
import { ReminderLog } from '../models/ReminderLog.js';
import { assignSeatSchema, expenseSchema, queueEntrySchema, userRegisterSchema } from '../validators/index.js';
import { logAudit } from '../services/auditService.js';
import { checkPlanLimit } from '../services/planLimitService.js';
import { createNotification } from '../services/notificationService.js';

function getManagerBranchId(req: AuthenticatedRequest): Types.ObjectId {
  if (!req.user?.branchId) throw new Error('Unauthenticated manager branch context');
  return new Types.ObjectId(req.user.branchId);
}

function getManagerAdminId(req: AuthenticatedRequest): Types.ObjectId {
  if (!req.user?.adminId) throw new Error('Unauthenticated manager admin context');
  return new Types.ObjectId(req.user.adminId);
}

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const adminId = getManagerAdminId(req);

  const [
    branch,
    permissions,
    totalUsers,
    activeUsers,
    totalSeats,
    assignedSeats,
    waitingQueue,
    recentExpenses,
  ] = await Promise.all([
    Branch.findById(branchId),
    ManagerPermission.findOne({ managerId: req.user!.id }),
    User.countDocuments({ branchId }),
    User.countDocuments({ branchId, entryStatus: 'ACTIVE' }),
    Seat.countDocuments({ branchId }),
    Seat.countDocuments({ branchId, status: 'ASSIGNED' }),
    QueueEntry.countDocuments({ branchId, status: 'WAITING' }),
    Expense.find({ branchId }).sort({ date: -1 }).limit(5),
  ]);

  res.json({
    success: true,
    branch,
    permissions,
    metrics: {
      totalUsers,
      activeUsers,
      totalSeats,
      assignedSeats,
      waitingQueue,
      availableSeats: totalSeats - assignedSeats,
    },
    recentExpenses,
  });
}

export async function getBranchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const users = await User.find({ branchId })
    .populate('currentSeat', 'seatNumber')
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ success: true, users });
}

export async function createBranchUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = getManagerAdminId(req);
  const branchId = getManagerBranchId(req);

  const limitCheck = await checkPlanLimit(adminId, 'users');
  if (!limitCheck.allowed) {
    res.status(403).json({
      success: false,
      code: 'PLAN_LIMIT_REACHED',
      message: 'Library patron limit reached. Please inform library admin.',
    });
    return;
  }

  const data = userRegisterSchema.parse({ ...req.body, adminId: adminId.toString(), branchId: branchId.toString() });

  const existing = await User.findOne({ adminId, email: data.email });
  if (existing) {
    res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = await User.create({
    adminId,
    branchId,
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
    actorRole: 'MANAGER',
    actorName: req.user!.name,
    adminId,
    branchId,
    action: 'USER_CREATED',
    target: 'User',
    targetId: user._id.toString(),
    metadata: { name: user.name },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
}

export async function getBranchSeats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const seats = await Seat.find({ branchId })
    .populate('assignedUserId', 'name email phone whatsappNumber')
    .sort({ seatNumber: 1 });

  res.json({ success: true, seats });
}

export async function assignBranchSeat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const adminId = getManagerAdminId(req);
  const data = assignSeatSchema.parse(req.body);

  const seat = await Seat.findOne({ _id: data.seatId, branchId });
  if (!seat) {
    res.status(404).json({ success: false, code: 'SEAT_NOT_FOUND', message: 'Seat not found in this branch' });
    return;
  }

  const user = await User.findOne({ _id: data.userId, adminId });
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  seat.status = 'ASSIGNED';
  seat.assignedUserId = user._id;
  seat.assignedFrom = new Date(data.startDate);
  seat.assignedUntil = new Date(data.endDate);
  await seat.save();

  user.currentSeat = seat._id;
  user.branchId = branchId;
  user.entryStatus = 'ACTIVE';
  await user.save();

  const assignment = await SeatAssignment.create({
    adminId,
    branchId,
    seatId: seat._id,
    userId: user._id,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: 'ACTIVE',
    assignedBy: new Types.ObjectId(req.user!.id),
    assignedByRole: 'MANAGER',
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
    actorRole: 'MANAGER',
    actorName: req.user!.name,
    adminId,
    branchId,
    action: 'SEAT_ASSIGNED',
    target: 'Seat',
    targetId: seat._id.toString(),
    metadata: { seatNumber: seat.seatNumber, userName: user.name },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, message: 'Seat assigned successfully', seat, assignment });
}

export async function getBranchQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const queue = await QueueEntry.find({ branchId, status: 'WAITING' })
    .populate('userId', 'name email phone whatsappNumber')
    .sort({ priority: -1, createdAt: 1 });

  res.json({ success: true, queue });
}

export async function addBranchQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const adminId = getManagerAdminId(req);
  const data = queueEntrySchema.parse({ ...req.body, branchId: branchId.toString() });

  const user = await User.findOne({ _id: data.userId, adminId });
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  const queueEntry = await QueueEntry.create({
    adminId,
    branchId,
    userId: user._id,
    priority: data.priority,
    notes: data.notes,
    status: 'WAITING',
    addedBy: new Types.ObjectId(req.user!.id),
    addedByRole: 'MANAGER',
  });

  user.entryStatus = 'QUEUE';
  await user.save();

  res.status(201).json({ success: true, queueEntry });
}

export async function promoteBranchQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const { queueId } = req.params;

  const entry = await QueueEntry.findOne({ _id: queueId, branchId });
  if (!entry) {
    res.status(404).json({ success: false, code: 'QUEUE_NOT_FOUND', message: 'Queue item not found' });
    return;
  }

  entry.status = 'PROMOTED';
  entry.promotedAt = new Date();
  await entry.save();

  await User.findByIdAndUpdate(entry.userId, { entryStatus: 'ACTIVE' });

  res.json({ success: true, message: 'User promoted', entry });
}

export async function getBranchExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const expenses = await Expense.find({ branchId }).sort({ date: -1 });

  res.json({ success: true, expenses });
}

export async function createBranchExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  const branchId = getManagerBranchId(req);
  const adminId = getManagerAdminId(req);
  const data = expenseSchema.parse({ ...req.body, branchId: branchId.toString() });

  const expense = await Expense.create({
    adminId,
    branchId,
    title: data.title,
    amount: data.amount,
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    category: data.category,
    recordedBy: new Types.ObjectId(req.user!.id),
    recordedByRole: 'MANAGER',
  });

  res.status(201).json({ success: true, expense });
}

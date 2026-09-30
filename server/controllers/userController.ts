import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types/index.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Seat } from '../models/Seat.js';
import { UserPlan } from '../models/UserPlan.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { PaymentConfig } from '../models/PaymentConfig.js';
import { Notification } from '../models/Notification.js';
import { submitPaymentSchema } from '../validators/index.js';
import { getActiveUserSubscription } from '../services/subscriptionService.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = new Types.ObjectId(req.user!.id);
  const user = await User.findById(userId).select('-password');
  if (!user) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  const [subscription, seat, branch, latestPayment, unreadNotifications] = await Promise.all([
    getActiveUserSubscription(userId),
    user.currentSeat ? Seat.findById(user.currentSeat) : null,
    user.branchId ? Branch.findById(user.branchId).select('name address phone openingTime closingTime') : null,
    Payment.findOne({ userId, type: 'USER_PLAN' }).sort({ createdAt: -1 }),
    Notification.countDocuments({ recipientId: userId, isRead: false }),
  ]);

  let daysRemaining = 0;
  if (subscription) {
    const diff = new Date(subscription.expiresAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  res.json({
    success: true,
    dashboard: {
      user,
      subscription,
      daysRemaining,
      seat,
      branch,
      latestPayment,
      unreadNotifications,
    },
  });
}

export async function getAvailablePlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = new Types.ObjectId(req.user!.adminId!);
  const [plans, paymentConfig] = await Promise.all([
    UserPlan.find({ adminId, isActive: true }).sort({ price: 1 }),
    PaymentConfig.findOne({ scope: 'ADMIN', adminId }),
  ]);

  res.json({
    success: true,
    plans,
    paymentConfig,
  });
}

export async function submitPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = new Types.ObjectId(req.user!.id);
  const adminId = new Types.ObjectId(req.user!.adminId!);
  const { planId, utr, screenshot, branchId } = submitPaymentSchema.parse(req.body);

  const plan = await UserPlan.findOne({ _id: planId, adminId });
  if (!plan) {
    res.status(404).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'User plan not found' });
    return;
  }

  const existing = await Payment.findOne({ utr, adminId });
  if (existing) {
    res.status(400).json({ success: false, code: 'DUPLICATE_UTR', message: 'This UTR has already been submitted.' });
    return;
  }

  const payment = await Payment.create({
    type: 'USER_PLAN',
    adminId,
    userId,
    planId: plan._id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
    utr,
    screenshot,
    status: 'PENDING',
  });

  if (branchId) {
    await User.findByIdAndUpdate(userId, { branchId: new Types.ObjectId(branchId) });
  }

  // Notify library admin
  await createNotification({
    recipientRole: 'ADMIN',
    recipientId: adminId,
    title: 'New Patron Payment Submitted',
    message: `${req.user!.name} submitted payment of ₹${plan.price} for plan "${plan.name}" (UTR: ${utr}).`,
    type: 'PAYMENT',
  });

  await logAudit({
    actorId: userId,
    actorRole: 'USER',
    actorName: req.user!.name,
    adminId,
    action: 'PAYMENT_SUBMITTED',
    target: 'Payment',
    targetId: payment._id.toString(),
    metadata: { planName: plan.name, amount: plan.price, utr },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    message: 'Payment submitted successfully. Awaiting library administrator approval.',
    payment,
  });
}

export async function getMyPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = new Types.ObjectId(req.user!.id);
  const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

  res.json({ success: true, payments });
}

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = new Types.ObjectId(req.user!.id);
  const notifications = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50);

  res.json({ success: true, notifications });
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = new Types.ObjectId(req.user!.id);

  if (id === 'all') {
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
    return;
  }

  await Notification.findOneAndUpdate({ _id: id, recipientId: userId }, { isRead: true });
  res.json({ success: true, message: 'Notification marked as read' });
}

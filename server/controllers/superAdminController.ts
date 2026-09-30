import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types/index.js';
import { Admin } from '../models/Admin.js';
import { Manager } from '../models/Manager.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Plan } from '../models/Plan.js';
import { Payment } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';
import { Seat } from '../models/Seat.js';
import { Expense } from '../models/Expense.js';
import { UserPlan } from '../models/UserPlan.js';
import { AuditLog } from '../models/AuditLog.js';
import { PaymentConfig } from '../models/PaymentConfig.js';
import { planSchema, paymentConfigSchema, reviewPaymentSchema } from '../validators/index.js';
import { calculateExpiryDate } from '../services/subscriptionService.js';
import { getAdminUsageStats } from '../services/planLimitService.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import {
  getImgbbApiKeys,
  addImgbbApiKey,
  removeImgbbApiKey,
  testImgbbApiKey,
} from '../services/imgbbService.js';

export async function getDashboardMetrics(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const [
    totalAdmins,
    activeAdmins,
    totalManagers,
    totalUsers,
    totalBranches,
    activePlans,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    revenueAgg,
    recentActivity,
  ] = await Promise.all([
    Admin.countDocuments(),
    Admin.countDocuments({ status: 'ACTIVE' }),
    Manager.countDocuments(),
    User.countDocuments(),
    Branch.countDocuments(),
    Plan.countDocuments({ isActive: true }),
    Payment.countDocuments({ type: 'SAAS_PLAN', status: 'PENDING' }),
    Payment.countDocuments({ type: 'SAAS_PLAN', status: 'APPROVED' }),
    Payment.countDocuments({ type: 'SAAS_PLAN', status: 'REJECTED' }),
    Payment.aggregate([
      { $match: { type: 'SAAS_PLAN', status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    AuditLog.find().sort({ createdAt: -1 }).limit(10),
  ]);

  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  res.json({
    success: true,
    metrics: {
      totalAdmins,
      activeAdmins,
      totalManagers,
      totalUsers,
      totalBranches,
      activePlans,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      totalRevenue,
      recentActivity,
    },
  });
}

export async function getAdmins(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const search = (req.query.search as string || '').trim();
  const status = req.query.status as string;

  const query: any = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { organizationName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [admins, total] = await Promise.all([
    Admin.find(query)
      .populate('currentSubscription')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password'),
    Admin.countDocuments(query),
  ]);

  res.json({
    success: true,
    admins,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function getAdminDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  const adminId = req.params.adminId as string;
  if (!adminId || !Types.ObjectId.isValid(adminId)) {
    res.status(400).json({ success: false, code: 'INVALID_ID', message: 'Valid Admin ID required' });
    return;
  }

  const adminObjectId = new Types.ObjectId(adminId);
  const admin = await Admin.findById(adminObjectId).select('-password');
  if (!admin) {
    res.status(404).json({ success: false, code: 'ADMIN_NOT_FOUND', message: 'Admin not found' });
    return;
  }

  const [
    usageStats,
    subscription,
    payments,
    branches,
    managers,
    users,
    plans,
    seats,
    expenses,
    activity,
  ] = await Promise.all([
    getAdminUsageStats(adminObjectId),
    Subscription.findOne({ adminId: adminObjectId, type: 'SAAS_ADMIN' }).sort({ createdAt: -1 }),
    Payment.find({ adminId: adminObjectId }).sort({ createdAt: -1 }),
    Branch.find({ adminId: adminObjectId }),
    Manager.find({ adminId: adminObjectId }).select('-password').populate('branchId', 'name'),
    User.find({ adminId: adminObjectId }).select('-password').limit(100),
    UserPlan.find({ adminId: adminObjectId }),
    Seat.find({ adminId: adminObjectId }).populate('branchId', 'name'),
    Expense.find({ adminId: adminObjectId }).sort({ date: -1 }).limit(50),
    AuditLog.find({ adminId: adminObjectId }).sort({ createdAt: -1 }).limit(50),
  ]);

  res.json({
    success: true,
    admin,
    usageStats,
    subscription,
    payments,
    branches,
    managers,
    users,
    plans,
    seats,
    expenses,
    activity,
  });
}

export async function updateAdminStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { adminId } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
    res.status(400).json({ success: false, code: 'INVALID_STATUS', message: 'Status must be ACTIVE, SUSPENDED, or INACTIVE' });
    return;
  }

  const admin = await Admin.findByIdAndUpdate(adminId, { status }, { new: true }).select('-password');
  if (!admin) {
    res.status(404).json({ success: false, code: 'ADMIN_NOT_FOUND', message: 'Admin not found' });
    return;
  }

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    adminId: admin._id,
    action: 'ADMIN_STATUS_UPDATED',
    target: 'Admin',
    targetId: admin._id.toString(),
    metadata: { status },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, admin });
}

export async function getSaaSPlans(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const plans = await Plan.find().sort({ price: 1 });
  res.json({ success: true, plans });
}

export async function createSaaSPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = planSchema.parse(req.body);
  const plan = await Plan.create(data);

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    action: 'PLAN_CREATED',
    target: 'Plan',
    targetId: plan._id.toString(),
    metadata: { name: plan.name, price: plan.price },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({ success: true, plan });
}

export async function updateSaaSPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { planId } = req.params;
  const data = planSchema.partial().parse(req.body);

  const plan = await Plan.findByIdAndUpdate(planId, data, { new: true });
  if (!plan) {
    res.status(404).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    return;
  }

  res.json({ success: true, plan });
}

export async function deleteSaaSPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { planId } = req.params;
  const activeSubsCount = await Subscription.countDocuments({ planId, status: 'ACTIVE' });
  if (activeSubsCount > 0) {
    res.status(400).json({
      success: false,
      code: 'PLAN_IN_USE',
      message: `Cannot delete plan with ${activeSubsCount} active subscriber(s). Deactivate it instead.`,
    });
    return;
  }

  await Plan.findByIdAndDelete(planId);
  res.json({ success: true, message: 'Plan deleted successfully' });
}

export async function getAdminPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const status = req.query.status as string;

  const query: any = { type: 'SAAS_PLAN' };
  if (status) query.status = status;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('adminId', 'name email organizationName phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  res.json({
    success: true,
    payments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function reviewAdminPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { paymentId } = req.params;
  const { action, rejectionReason } = reviewPaymentSchema.parse(req.body);

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    res.status(404).json({ success: false, code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' });
    return;
  }

  if (payment.status !== 'PENDING') {
    res.status(400).json({
      success: false,
      code: 'ALREADY_REVIEWED',
      message: `Payment has already been ${payment.status.toLowerCase()}`,
    });
    return;
  }

  payment.reviewedBy = new Types.ObjectId(req.user!.id);
  payment.reviewedByRole = req.user!.role;
  payment.reviewedAt = new Date();

  if (action === 'APPROVE') {
    payment.status = 'APPROVED';
    await payment.save();

    const plan = await Plan.findById(payment.planId);
    if (!plan) {
      res.status(400).json({ success: false, code: 'PLAN_NOT_FOUND', message: 'Referenced plan was not found' });
      return;
    }

    const startDate = new Date();
    const expiresAt = calculateExpiryDate(plan.validity, plan.validityUnit, startDate);

    // Create or update active subscription
    const subscription = await Subscription.create({
      type: 'SAAS_ADMIN',
      adminId: payment.adminId,
      planId: plan._id,
      planSnapshot: {
        name: plan.name,
        price: plan.price,
        validity: plan.validity,
        validityUnit: plan.validityUnit,
        maxBranches: plan.maxBranches,
        maxManagers: plan.maxManagers,
        maxUsers: plan.maxUsers,
        maxSeats: plan.maxSeats,
        maxMessages: plan.maxMessages,
        maxQueueEntries: plan.maxQueueEntries,
      },
      startDate,
      expiresAt,
      status: 'ACTIVE',
      paymentId: payment._id,
    });

    // Update Admin currentSubscription
    await Admin.findByIdAndUpdate(payment.adminId, {
      currentSubscription: subscription._id,
      status: 'ACTIVE',
    });

    await createNotification({
      recipientRole: 'ADMIN',
      recipientId: payment.adminId,
      title: 'Subscription Activated! 🎉',
      message: `Your payment of ₹${payment.amount} for plan "${plan.name}" has been approved. Your subscription is active until ${expiresAt.toLocaleDateString()}.`,
      type: 'PAYMENT',
    });

    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      actorName: req.user!.name,
      adminId: payment.adminId,
      action: 'PAYMENT_APPROVED',
      target: 'Payment',
      targetId: payment._id.toString(),
      metadata: { amount: payment.amount, planName: plan.name, expiresAt },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Payment approved and subscription activated successfully',
      payment,
      subscription,
    });
  } else {
    payment.status = 'REJECTED';
    payment.rejectionReason = rejectionReason || 'Payment verification could not be completed';
    await payment.save();

    await createNotification({
      recipientRole: 'ADMIN',
      recipientId: payment.adminId,
      title: 'Payment Verification Failed',
      message: `Your payment of ₹${payment.amount} was rejected: ${payment.rejectionReason}`,
      type: 'PAYMENT',
    });

    await logAudit({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      actorName: req.user!.name,
      adminId: payment.adminId,
      action: 'PAYMENT_REJECTED',
      target: 'Payment',
      targetId: payment._id.toString(),
      metadata: { reason: payment.rejectionReason },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Payment rejected',
      payment,
    });
  }
}

export async function getSuperAdminPaymentConfig(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const config = await PaymentConfig.findOne({ scope: 'SUPERADMIN' });
  res.json({ success: true, config });
}

export async function updateSuperAdminPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = paymentConfigSchema.parse(req.body);

  const config = await PaymentConfig.findOneAndUpdate(
    { scope: 'SUPERADMIN' },
    { ...data, scope: 'SUPERADMIN' },
    { upsert: true, new: true }
  );

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    action: 'PAYMENT_CONFIG_UPDATED',
    target: 'PaymentConfig',
    metadata: { upiId: config.upiId },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, config });
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const action = req.query.action as string;

  const query: any = {};
  if (action) query.action = action;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getImgbbKeys(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const keys = await getImgbbApiKeys();
  res.json({ success: true, keys });
}

export async function addImgbbKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { key } = req.body;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ success: false, code: 'INVALID_KEY', message: 'Valid API key is required' });
    return;
  }

  const keys = await addImgbbApiKey(key);

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    action: 'IMGBB_KEY_ADDED',
    target: 'SystemConfig',
    metadata: { keyMasked: `••••${key.trim().slice(-4)}` },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, message: 'ImgBB API key added to pool', keys });
}

export async function removeImgbbKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { key } = req.body;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ success: false, code: 'INVALID_KEY', message: 'Valid API key is required' });
    return;
  }

  const keys = await removeImgbbApiKey(key);

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    action: 'IMGBB_KEY_REMOVED',
    target: 'SystemConfig',
    metadata: { keyMasked: `••••${key.trim().slice(-4)}` },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, message: 'ImgBB API key removed from pool', keys });
}

export async function testImgbbKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { key } = req.body;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ success: false, code: 'INVALID_KEY', message: 'Valid API key is required' });
    return;
  }

  const result = await testImgbbApiKey(key);
  res.json({ success: result.valid, message: result.message });
}

export async function getPlatformSiteSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { getSiteSettings } = await import('../services/siteSettingsService.js');
  const settings = await getSiteSettings();
  res.json({ success: true, settings });
}

export async function updatePlatformSiteSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { getSiteSettings, updateSiteSettings } = await import('../services/siteSettingsService.js');
  const settings = await updateSiteSettings(req.body);

  await logAudit({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    actorName: req.user!.name,
    action: 'SITE_SETTINGS_UPDATED',
    target: 'SystemConfig',
    metadata: { siteName: settings.siteName },
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, message: 'Platform settings updated successfully', settings });
}

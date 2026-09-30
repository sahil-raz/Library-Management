import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { UserPlan } from '../models/UserPlan.js';
import { PaymentConfig } from '../models/PaymentConfig.js';
import { adminRegisterSchema, userRegisterSchema } from '../validators/index.js';
import { ENV } from '../config/env.js';
import { AuthUserPayload } from '../types/index.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export async function registerAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = adminRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join('. ');
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: errorMsg || 'Invalid registration details',
        errors: parseResult.error.errors,
      });
      return;
    }
    const data = parseResult.data;

    const existing = await Admin.findOne({ email: data.email });
    if (existing) {
      res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An administrator account with this email already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      password: hashedPassword,
      organizationName: data.organizationName,
      status: 'ACTIVE',
    });

    // Create default payment configuration for the admin (safe failover if already exists)
    try {
      await PaymentConfig.create({
        scope: 'ADMIN',
        adminId: admin._id,
        upiId: `${data.phone}@upi`,
        paymentName: data.organizationName,
        paymentInstructions: 'Please pay via UPI and submit the 12-digit UTR reference number and payment screenshot.',
      });
    } catch (paymentConfigErr) {
      console.warn('⚠️ [PaymentConfig] Warning during initial admin config creation:', paymentConfigErr);
    }

    const payload: AuthUserPayload = {
      id: admin._id.toString(),
      email: admin.email,
      role: 'ADMIN',
      name: admin.name,
      adminId: admin._id.toString(),
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });

    try {
      await logAudit({
        actorId: admin._id,
        actorRole: 'ADMIN',
        actorName: admin.name,
        adminId: admin._id,
        action: 'ADMIN_CREATED',
        target: 'Admin',
        targetId: admin._id.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (auditErr) {
      console.warn('⚠️ [Audit] Warning logging admin creation audit:', auditErr);
    }

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully. Please select a subscription plan to activate your library.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
        organizationName: admin.organizationName,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = userRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join('. ');
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: errorMsg || 'Invalid registration details',
        errors: parseResult.error.errors,
      });
      return;
    }
    const data = parseResult.data;

    const adminObjectId = new Types.ObjectId(data.adminId);
    const admin = await Admin.findById(adminObjectId);
    if (!admin) {
      res.status(404).json({
        success: false,
        code: 'LIBRARY_NOT_FOUND',
        message: 'The selected library does not exist.',
      });
      return;
    }

    const existing = await User.findOne({ adminId: adminObjectId, email: data.email });
    if (existing) {
      res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'A student/patron with this email already exists in this library.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      adminId: adminObjectId,
      branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      address: data.address,
      emergencyContact: data.emergencyContact,
      photo: data.photo,
      password: hashedPassword,
      entryStatus: 'NONE',
    });

    try {
      await logAudit({
        actorId: user._id,
        actorRole: 'USER',
        actorName: user.name,
        adminId: admin._id,
        branchId: user.branchId,
        action: 'USER_CREATED',
        target: 'User',
        targetId: user._id.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (auditErr) {
      console.warn('⚠️ [Audit] Warning logging user creation:', auditErr);
    }

    // Notify admin
    try {
      await createNotification({
        recipientRole: 'ADMIN',
        recipientId: admin._id,
        title: 'New Member Registered',
        message: `${user.name} has registered for ${admin.organizationName}.`,
        type: 'SYSTEM',
      });
    } catch (notifErr) {
      console.warn('⚠️ [Notification] Warning creating registration notification:', notifErr);
    }

    const payload: AuthUserPayload = {
      id: user._id.toString(),
      email: user.email,
      role: 'USER',
      name: user.name,
      adminId: admin._id.toString(),
      branchId: user.branchId?.toString(),
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'USER',
        adminId: admin._id,
        branchId: user.branchId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicLibraries(_req: Request, res: Response): Promise<void> {
  const admins = await Admin.find({ status: 'ACTIVE' }).select('name organizationName phone email');
  const librariesWithBranches = await Promise.all(
    admins.map(async (admin) => {
      const branches = await Branch.find({ adminId: admin._id, status: 'ACTIVE' }).select('name address phone');
      return {
        id: admin._id,
        name: admin.name,
        organizationName: admin.organizationName,
        branches,
      };
    })
  );

  res.json({
    success: true,
    libraries: librariesWithBranches,
  });
}

export async function getPublicLibraryPlans(req: Request, res: Response): Promise<void> {
  const adminId = req.params.adminId as string;
  if (!adminId || !Types.ObjectId.isValid(adminId)) {
    res.status(400).json({ success: false, code: 'INVALID_ID', message: 'Valid Library ID required' });
    return;
  }

  const plans = await UserPlan.find({ adminId: new Types.ObjectId(adminId), isActive: true });
  res.json({
    success: true,
    plans,
  });
}

export async function getPublicPaymentConfig(req: Request, res: Response): Promise<void> {
  const { scope, adminId } = req.query;

  if (scope === 'SUPERADMIN') {
    const config = await PaymentConfig.findOne({ scope: 'SUPERADMIN' });
    res.json({ success: true, config });
    return;
  }

  if (adminId && Types.ObjectId.isValid(adminId as string)) {
    const config = await PaymentConfig.findOne({ scope: 'ADMIN', adminId: new Types.ObjectId(adminId as string) });
    res.json({ success: true, config });
    return;
  }

  res.status(400).json({ success: false, code: 'INVALID_QUERY', message: 'Provide scope=SUPERADMIN or adminId' });
}

export async function getPublicSiteSettings(_req: Request, res: Response): Promise<void> {
  const { getSiteSettings } = await import('../services/siteSettingsService.js');
  const settings = await getSiteSettings();
  res.json({ success: true, settings });
}

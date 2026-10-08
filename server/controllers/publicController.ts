import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Admin } from '../models/Admin.js';
import { Branch } from '../models/Branch.js';
import { UserPlan } from '../models/UserPlan.js';
import { PaymentConfig } from '../models/PaymentConfig.js';
import { adminRegisterSchema, sendOtpSchema } from '../validators/index.js';
import { ENV } from '../config/env.js';
import { AuthUserPayload } from '../types/index.js';
import { logAudit } from '../services/auditService.js';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../services/whatsappService.js';

// Send WhatsApp OTP for Admin Registration
export async function sendAdminOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join('. ');
      res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: errorMsg });
      return;
    }

    const { phone, email } = parseResult.data;

    // Check if phone number already registered
    const existingPhone = await Admin.findOne({ phone: phone.trim() });
    if (existingPhone) {
      res.status(409).json({
        success: false,
        code: 'PHONE_ALREADY_EXISTS',
        message: 'An administrator account with this phone number already exists.',
      });
      return;
    }

    // Check if email already registered (if provided)
    if (email) {
      const existingEmail = await Admin.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        res.status(409).json({
          success: false,
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An administrator account with this email already exists.',
        });
        return;
      }
    }

    const { waLink } = await sendWhatsAppOtp(phone.trim(), 'ADMIN_SIGNUP');

    res.json({
      success: true,
      message: `WhatsApp OTP sent successfully to ${phone}. Enter the 6-digit code to verify.`,
      waLink,
    });
  } catch (error) {
    next(error);
  }
}

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

    // Check unique email
    const existingEmail = await Admin.findOne({ email: data.email });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An administrator account with this email already exists.',
      });
      return;
    }

    // Check unique phone number
    const existingPhone = await Admin.findOne({ phone: data.phone });
    if (existingPhone) {
      res.status(409).json({
        success: false,
        code: 'PHONE_ALREADY_EXISTS',
        message: 'An administrator account with this phone number already exists.',
      });
      return;
    }

    // Verify WhatsApp OTP
    const isOtpValid = await verifyWhatsAppOtp(data.phone, data.otp, 'ADMIN_SIGNUP');
    if (!isOtpValid) {
      res.status(400).json({
        success: false,
        code: 'INVALID_OTP',
        message: 'Invalid or expired WhatsApp OTP. Please request a new OTP.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber || data.phone,
      password: hashedPassword,
      organizationName: data.organizationName,
      status: 'ACTIVE',
      whatsappAlertsUsed: 0,
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
        phone: admin.phone,
        role: 'ADMIN',
        organizationName: admin.organizationName,
      },
    });
  } catch (error) {
    next(error);
  }
}

// User self-registration disabled as users are managed by Admin without credentials
export async function registerUser(_req: Request, res: Response): Promise<void> {
  res.status(403).json({
    success: false,
    code: 'FEATURE_DISABLED',
    message: 'Student self-registration is disabled. Students are added and managed directly by the Library Administration.',
  });
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

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { Admin } from '../models/Admin.js';
import { Manager } from '../models/Manager.js';
import { ManagerPermission } from '../models/ManagerPermission.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { AuthenticatedRequest, AuthUserPayload, UserRole } from '../types/index.js';
import { loginSchema, changePasswordSchema } from '../validators/index.js';
import { logAudit } from '../services/auditService.js';
import {
  createSession,
  revokeSession,
  revokeAllUserSessions,
} from '../services/sessionService.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  let userObj: any = null;
  let role: UserRole | null = null;
  let adminId: string | undefined = undefined;
  let branchId: string | undefined = undefined;

  // 1. Check SuperAdmin
  const superAdmin = await SuperAdmin.findOne({ email });
  if (superAdmin) {
    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (isMatch) {
      userObj = superAdmin;
      role = 'SUPER_ADMIN';
    }
  }

  // 2. Check Admin
  if (!userObj) {
    const admin = await Admin.findOne({ email });
    if (admin) {
      if (admin.status === 'SUSPENDED') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your administrator account has been suspended. Please contact platform support.',
        });
        return;
      }
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        userObj = admin;
        role = 'ADMIN';
        adminId = admin._id.toString();
      }
    }
  }

  // 3. Check Manager
  if (!userObj) {
    const manager = await Manager.findOne({ email });
    if (manager) {
      if (manager.status === 'INACTIVE') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_INACTIVE',
          message: 'Your staff account is currently inactive. Please contact your library administrator.',
        });
        return;
      }
      const isMatch = await bcrypt.compare(password, manager.password);
      if (isMatch) {
        userObj = manager;
        role = 'MANAGER';
        adminId = manager.adminId.toString();
        branchId = manager.branchId.toString();
      }
    }
  }

  // 4. Check User
  if (!userObj) {
    const user = await User.findOne({ email });
    if (user) {
      if (user.entryStatus === 'SUSPENDED') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your membership is suspended. Please contact the library administrator.',
        });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        userObj = user;
        role = 'USER';
        adminId = user.adminId.toString();
        branchId = user.branchId?.toString();
      }
    }
  }

  if (!userObj || !role) {
    res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    return;
  }

  const deviceId = (req.headers['x-device-id'] as string) || (req.body.deviceId as string) || undefined;
  const userAgent = req.get('user-agent') || undefined;

  const sessionAuth = await createSession({
    userId: userObj._id,
    role,
    email: userObj.email,
    name: userObj.name,
    adminId,
    branchId,
    deviceId,
    userAgent,
    ip: req.ip,
  });

  // Log audit
  await logAudit({
    actorId: userObj._id,
    actorRole: role,
    actorName: userObj.name,
    adminId,
    branchId,
    action: 'LOGIN',
    target: 'Auth',
    metadata: { sessionId: sessionAuth.sessionId, expiresAt: sessionAuth.expiresAt },
    ip: req.ip,
    userAgent,
  });

  res.json({
    success: true,
    token: sessionAuth.token,
    expiresAt: sessionAuth.expiresAt,
    user: {
      id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role,
      adminId,
      branchId,
      mustChangePassword: role === 'SUPER_ADMIN' ? (userObj as any).mustChangePassword : false,
      organizationName: role === 'ADMIN' ? (userObj as any).organizationName : undefined,
    },
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Not authenticated' });
    return;
  }

  const { id, role } = req.user;
  let userDetails: any = null;
  let permissions = null;
  let subscription = null;

  if (role === 'SUPER_ADMIN') {
    userDetails = await SuperAdmin.findById(id).select('-password');
  } else if (role === 'ADMIN') {
    userDetails = await Admin.findById(id).select('-password');
    subscription = await Subscription.findOne({ adminId: id, type: 'SAAS_ADMIN', status: 'ACTIVE' });
  } else if (role === 'MANAGER') {
    userDetails = await Manager.findById(id).select('-password').populate('branchId', 'name address');
    permissions = await ManagerPermission.findOne({ managerId: id });
  } else if (role === 'USER') {
    userDetails = await User.findById(id).select('-password').populate('branchId', 'name address').populate('currentSeat', 'seatNumber');
    subscription = await Subscription.findOne({ userId: id, type: 'LIBRARY_USER', status: 'ACTIVE' });
  }

  if (!userDetails) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User record not found' });
    return;
  }

  res.json({
    success: true,
    user: {
      ...userDetails.toObject(),
      role,
      permissions,
      subscription,
    },
  });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Not authenticated' });
    return;
  }

  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const { id, role } = req.user;

  let userRecord: any = null;
  if (role === 'SUPER_ADMIN') userRecord = await SuperAdmin.findById(id);
  else if (role === 'ADMIN') userRecord = await Admin.findById(id);
  else if (role === 'MANAGER') userRecord = await Manager.findById(id);
  else if (role === 'USER') userRecord = await User.findById(id);

  if (!userRecord) {
    res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, userRecord.password);
  if (!isMatch) {
    res.status(400).json({
      success: false,
      code: 'INVALID_PASSWORD',
      message: 'Current password does not match',
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  userRecord.password = await bcrypt.hash(newPassword, salt);

  if (role === 'SUPER_ADMIN') {
    userRecord.mustChangePassword = false;
  }

  await userRecord.save();

  // Invalidate all existing sessions on password change
  await revokeAllUserSessions(id);

  await logAudit({
    actorId: id,
    actorRole: role,
    actorName: userRecord.name,
    adminId: req.user.adminId,
    action: 'PASSWORD_CHANGED',
    target: 'Auth',
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const sessionId = (req as any).sessionId;
  if (sessionId) {
    await revokeSession(sessionId);
  }

  if (req.user) {
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      adminId: req.user.adminId,
      branchId: req.user.branchId,
      action: 'LOGOUT',
      target: 'Auth',
      metadata: { sessionId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

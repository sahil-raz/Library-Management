import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Session, ISession } from '../models/Session.js';
import { ENV } from '../config/env.js';
import { AuthUserPayload, UserRole } from '../types/index.js';

export const SESSION_DURATION_DAYS = 7;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Computes a SHA-256 hash of a string
 */
export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Normalizes user agent string to extract core browser/OS family to allow minor patch updates
 * while firmly blocking different browsers, platforms, or devices.
 */
export function normalizeUserAgent(ua?: string): string {
  if (!ua) return 'unknown_device';
  return ua.trim().slice(0, 255);
}

/**
 * Computes the unique device fingerprint tying the session to the browser & device
 */
export function computeDeviceFingerprint(deviceId: string, userAgent?: string): string {
  const normUA = normalizeUserAgent(userAgent);
  return hashString(`${deviceId.trim()}::${normUA}`);
}

export interface CreateSessionParams {
  userId: Types.ObjectId | string;
  role: UserRole;
  email: string;
  name: string;
  adminId?: string;
  branchId?: string;
  deviceId?: string;
  userAgent?: string;
  ip?: string;
}

export interface SessionAuthResult {
  token: string;
  expiresAt: Date;
  sessionId: string;
}

/**
 * Creates a new 7-day persistent session bound to the user's browser/device
 */
export async function createSession(params: CreateSessionParams): Promise<SessionAuthResult> {
  const userObjectId = new Types.ObjectId(params.userId);
  const deviceId = params.deviceId?.trim() || crypto.randomUUID();
  const deviceFingerprint = computeDeviceFingerprint(deviceId, params.userAgent);

  // Generate high-entropy raw session token
  const rawTokenSecret = crypto.randomBytes(32).toString('hex');
  const sessionTokenHash = hashString(rawTokenSecret);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  // Save session record to MongoDB
  const session = await Session.create({
    userId: userObjectId,
    role: params.role,
    sessionTokenHash,
    deviceId,
    deviceFingerprint,
    deviceInfo: {
      ip: params.ip,
      userAgent: params.userAgent,
    },
    isValid: true,
    expiresAt,
    lastActiveAt: now,
  });

  // Create JWT bearer token encoding session identity
  const payload: AuthUserPayload & { sessionId: string; tokenSecret: string } = {
    id: userObjectId.toString(),
    email: params.email,
    role: params.role,
    name: params.name,
    adminId: params.adminId,
    branchId: params.branchId,
    sessionId: session._id.toString(),
    tokenSecret: rawTokenSecret,
  };

  const token = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });

  return {
    token,
    expiresAt,
    sessionId: session._id.toString(),
  };
}

export interface ValidateSessionResult {
  valid: boolean;
  code?: string;
  message?: string;
  user?: AuthUserPayload;
  session?: ISession;
}

/**
 * Validates session token, expiration (7 days), device binding, and revocation status
 */
export async function validateSession(
  token: string,
  incomingDeviceId?: string,
  incomingUserAgent?: string
): Promise<ValidateSessionResult> {
  let decoded: any;
  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET);
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return {
        valid: false,
        code: 'SESSION_EXPIRED',
        message: 'Your 7-day session has expired. Please log in again.',
      };
    }
    return {
      valid: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid session token signature.',
    };
  }

  const { sessionId, tokenSecret, id, email, role, name, adminId, branchId } = decoded;

  if (!sessionId || !tokenSecret) {
    return {
      valid: false,
      code: 'MALFORMED_SESSION',
      message: 'Authentication token is missing session metadata.',
    };
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    return {
      valid: false,
      code: 'SESSION_NOT_FOUND',
      message: 'Active session not found or has been revoked.',
    };
  }

  if (!session.isValid) {
    return {
      valid: false,
      code: 'SESSION_REVOKED',
      message: 'This session has been explicitly logged out or terminated.',
    };
  }

  // Check 7-day expiration date
  if (new Date() > session.expiresAt) {
    session.isValid = false;
    await session.save();
    return {
      valid: false,
      code: 'SESSION_EXPIRED',
      message: 'Your 7-day session has expired. Please log in again.',
    };
  }

  // Verify token hash matches stored hash
  const computedHash = hashString(tokenSecret);
  if (computedHash !== session.sessionTokenHash) {
    return {
      valid: false,
      code: 'TOKEN_HASH_MISMATCH',
      message: 'Session token authenticity check failed.',
    };
  }

  // Device Binding Security Check:
  // If the client provides a device ID, verify it matches the bound device for this session
  if (incomingDeviceId) {
    const expectedFingerprint = computeDeviceFingerprint(incomingDeviceId, incomingUserAgent);
    if (expectedFingerprint !== session.deviceFingerprint && incomingDeviceId !== session.deviceId) {
      console.warn(
        `🚨 [Security Alert] Session ${sessionId} accessed from unauthorized device! Registered: ${session.deviceId}, Incoming: ${incomingDeviceId}`
      );
      return {
        valid: false,
        code: 'DEVICE_MISMATCH',
        message: 'Access denied: This session is bound to another browser/device. Please log in from this device.',
      };
    }
  }

  // Update lastActiveAt periodically (debounced every 10 minutes to save DB writes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (session.lastActiveAt < tenMinutesAgo) {
    session.lastActiveAt = new Date();
    await session.save();
  }

  return {
    valid: true,
    user: {
      id,
      email,
      role,
      name,
      adminId,
      branchId,
    },
    session,
  };
}

/**
 * Revokes a session immediately upon explicit logout
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const result = await Session.findByIdAndUpdate(sessionId, { isValid: false });
  return !!result;
}

/**
 * Revokes all sessions for a user (e.g. on password change)
 */
export async function revokeAllUserSessions(userId: Types.ObjectId | string): Promise<void> {
  await Session.updateMany({ userId: new Types.ObjectId(userId) }, { isValid: false });
}

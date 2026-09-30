import { Subscription, ISubscription } from '../models/Subscription.js';
import { ValidityUnit } from '../types/index.js';
import { Types } from 'mongoose';

export function calculateExpiryDate(validity: number, unit: ValidityUnit, fromDate: Date = new Date()): Date {
  const expiry = new Date(fromDate);
  if (unit === 'Days') {
    expiry.setDate(expiry.getDate() + validity);
  } else if (unit === 'Months') {
    expiry.setMonth(expiry.getMonth() + validity);
  } else if (unit === 'Years') {
    expiry.setFullYear(expiry.getFullYear() + validity);
  }
  return expiry;
}

export async function getActiveAdminSubscription(adminId: string | Types.ObjectId): Promise<ISubscription | null> {
  const now = new Date();
  
  // Find subscription
  const sub = await Subscription.findOne({
    adminId: new Types.ObjectId(adminId.toString()),
    type: 'SAAS_ADMIN',
    status: 'ACTIVE',
  }).sort({ createdAt: -1 });

  if (!sub) return null;

  // Check if it has expired
  if (new Date(sub.expiresAt) < now) {
    sub.status = 'EXPIRED';
    await sub.save();
    return null;
  }

  return sub;
}

export async function getActiveUserSubscription(userId: string | Types.ObjectId): Promise<ISubscription | null> {
  const now = new Date();
  
  const sub = await Subscription.findOne({
    userId: new Types.ObjectId(userId.toString()),
    type: 'LIBRARY_USER',
    status: 'ACTIVE',
  }).sort({ createdAt: -1 });

  if (!sub) return null;

  if (new Date(sub.expiresAt) < now) {
    sub.status = 'EXPIRED';
    await sub.save();
    return null;
  }

  return sub;
}

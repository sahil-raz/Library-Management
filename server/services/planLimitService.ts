import { Types } from 'mongoose';
import { getActiveAdminSubscription } from './subscriptionService.js';
import { Branch } from '../models/Branch.js';
import { Manager } from '../models/Manager.js';
import { User } from '../models/User.js';
import { Seat } from '../models/Seat.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { ReminderLog } from '../models/ReminderLog.js';

export type LimitResource = 'branches' | 'managers' | 'users' | 'seats' | 'messages' | 'queue';

export interface PlanUsageStats {
  hasActivePlan: boolean;
  planName: string;
  expiresAt?: Date;
  daysRemaining?: number;
  branches: { current: number; max: number };
  managers: { current: number; max: number };
  users: { current: number; max: number };
  seats: { current: number; max: number };
  messages: { current: number; max: number };
  queue: { current: number; max: number };
}

export async function checkPlanLimit(
  adminId: string | Types.ObjectId,
  resource: LimitResource
): Promise<{ allowed: boolean; current: number; max: number; message?: string }> {
  const subscription = await getActiveAdminSubscription(adminId);

  if (!subscription) {
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: 'No active subscription. Please purchase a plan to unlock this feature.',
    };
  }

  const { planSnapshot } = subscription;
  const adminObjectId = new Types.ObjectId(adminId.toString());

  switch (resource) {
    case 'branches': {
      const current = await Branch.countDocuments({ adminId: adminObjectId, status: 'ACTIVE' });
      const max = planSnapshot.maxBranches || 1;
      return {
        allowed: current < max,
        current,
        max,
        message: current >= max ? `Plan limit reached: maximum ${max} branches allowed.` : undefined,
      };
    }
    case 'managers': {
      const current = await Manager.countDocuments({ adminId: adminObjectId, status: 'ACTIVE' });
      const max = planSnapshot.maxManagers || 1;
      return {
        allowed: current < max,
        current,
        max,
        message: current >= max ? `Plan limit reached: maximum ${max} managers allowed.` : undefined,
      };
    }
    case 'users': {
      const current = await User.countDocuments({ adminId: adminObjectId });
      const max = planSnapshot.maxUsers || 100;
      return {
        allowed: current < max,
        current,
        max,
        message: current >= max ? `Plan limit reached: maximum ${max} users allowed.` : undefined,
      };
    }
    case 'seats': {
      const current = await Seat.countDocuments({ adminId: adminObjectId });
      const max = planSnapshot.maxSeats || 50;
      return {
        allowed: current < max,
        current,
        max,
        message: current >= max ? `Plan limit reached: maximum ${max} seats allowed.` : undefined,
      };
    }
    case 'messages': {
      const current = await ReminderLog.countDocuments({ adminId: adminObjectId });
      const max = planSnapshot.maxMessages || 500;
      return {
        allowed: current < max,
        current,
        max,
        message: current >= max ? `Plan limit reached: maximum ${max} messages allowed.` : undefined,
      };
    }
    case 'queue': {
      const current = await QueueEntry.countDocuments({ adminId: adminObjectId, status: 'WAITING' });
      const max = planSnapshot.maxQueueEntries || 50;
      return {
        allowed: current < max,
        current,
        max,
        message: current >= max ? `Plan limit reached: maximum ${max} queue entries allowed.` : undefined,
      };
    }
    default:
      return { allowed: true, current: 0, max: 999999 };
  }
}

export async function getAdminUsageStats(adminId: string | Types.ObjectId): Promise<PlanUsageStats> {
  const subscription = await getActiveAdminSubscription(adminId);
  const adminObjectId = new Types.ObjectId(adminId.toString());

  const [branchesCount, managersCount, usersCount, seatsCount, messagesCount, queueCount] = await Promise.all([
    Branch.countDocuments({ adminId: adminObjectId }),
    Manager.countDocuments({ adminId: adminObjectId }),
    User.countDocuments({ adminId: adminObjectId }),
    Seat.countDocuments({ adminId: adminObjectId }),
    ReminderLog.countDocuments({ adminId: adminObjectId }),
    QueueEntry.countDocuments({ adminId: adminObjectId, status: 'WAITING' }),
  ]);

  if (!subscription) {
    return {
      hasActivePlan: false,
      planName: 'None',
      branches: { current: branchesCount, max: 0 },
      managers: { current: managersCount, max: 0 },
      users: { current: usersCount, max: 0 },
      seats: { current: seatsCount, max: 0 },
      messages: { current: messagesCount, max: 0 },
      queue: { current: queueCount, max: 0 },
    };
  }

  const { planSnapshot, expiresAt } = subscription;
  const now = new Date();
  const msRemaining = new Date(expiresAt).getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    hasActivePlan: true,
    planName: planSnapshot.name,
    expiresAt,
    daysRemaining,
    branches: { current: branchesCount, max: planSnapshot.maxBranches || 1 },
    managers: { current: managersCount, max: planSnapshot.maxManagers || 1 },
    users: { current: usersCount, max: planSnapshot.maxUsers || 100 },
    seats: { current: seatsCount, max: planSnapshot.maxSeats || 50 },
    messages: { current: messagesCount, max: planSnapshot.maxMessages || 500 },
    queue: { current: queueCount, max: planSnapshot.maxQueueEntries || 50 },
  };
}

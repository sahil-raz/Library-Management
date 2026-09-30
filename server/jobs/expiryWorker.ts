import { Subscription } from '../models/Subscription.js';
import { Seat } from '../models/Seat.js';
import { SeatAssignment } from '../models/SeatAssignment.js';
import { User } from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

export async function runSubscriptionExpiryJob(): Promise<void> {
  try {
    const now = new Date();

    // 1. Expire Admin subscriptions past expiresAt
    const expiredAdminSubs = await Subscription.find({
      type: 'SAAS_ADMIN',
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    });

    for (const sub of expiredAdminSubs) {
      sub.status = 'EXPIRED';
      await sub.save();

      await createNotification({
        recipientRole: 'ADMIN',
        recipientId: sub.adminId,
        title: 'Subscription Expired',
        message: 'Your library subscription has expired. Please renew your plan to restore full access.',
        type: 'EXPIRY',
      });

      await logAudit({
        actorId: sub.adminId,
        actorRole: 'SYSTEM',
        actorName: 'System Background Worker',
        adminId: sub.adminId,
        action: 'SUBSCRIPTION_EXPIRED',
        target: 'Subscription',
        targetId: sub._id.toString(),
        metadata: { type: 'SAAS_ADMIN', expiredAt: now },
      });
    }

    // 2. Expire User subscriptions past expiresAt
    const expiredUserSubs = await Subscription.find({
      type: 'LIBRARY_USER',
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    });

    for (const sub of expiredUserSubs) {
      sub.status = 'EXPIRED';
      await sub.save();

      if (sub.userId) {
        await User.findByIdAndUpdate(sub.userId, { entryStatus: 'EXPIRED' });

        await createNotification({
          recipientRole: 'USER',
          recipientId: sub.userId,
          title: 'Membership Expired',
          message: 'Your library membership subscription has expired. Please renew to keep your seat and access.',
          type: 'EXPIRY',
        });
      }
    }

    // 3. Expire Seat Assignments that have ended
    const expiredAssignments = await SeatAssignment.find({
      status: 'ACTIVE',
      endDate: { $lt: now },
    });

    for (const assign of expiredAssignments) {
      assign.status = 'EXPIRED';
      await assign.save();

      // Free seat
      await Seat.findByIdAndUpdate(assign.seatId, {
        status: 'AVAILABLE',
        $unset: { assignedUserId: 1, assignedFrom: 1, assignedUntil: 1 },
      });

      // Remove seat reference from user
      await User.findByIdAndUpdate(assign.userId, {
        $unset: { currentSeat: 1 },
      });
    }

  } catch (error) {
    console.error('[ExpiryWorker] Error running subscription expiry job:', error);
  }
}

export function startBackgroundJobs(): void {
  // Run on startup
  runSubscriptionExpiryJob();

  // Run every 10 minutes
  setInterval(runSubscriptionExpiryJob, 10 * 60 * 1000);
}


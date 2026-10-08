import { Subscription } from '../models/Subscription.js';
import { Seat } from '../models/Seat.js';
import { SeatAssignment } from '../models/SeatAssignment.js';
import { User } from '../models/User.js';
import { sendWhatsAppAlert } from '../services/whatsappService.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

export async function runSubscriptionExpiryJob(): Promise<void> {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

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

    // 2. Automated WhatsApp Expiry Notice: 2 Days Before Expiry
    const expiringSoonUsers = await User.find({
      planEndDate: { $gt: now, $lte: twoDaysFromNow },
      entryStatus: 'ACTIVE',
      'whatsappRemindersSent.twoDaysBefore': { $exists: false },
    })
      .populate('currentSeat')
      .populate('batchId')
      .populate('currentPlan');

    for (const user of expiringSoonUsers) {
      try {
        await sendWhatsAppAlert({
          adminId: user.adminId,
          user,
          templateKey: 'EXPIRY_2_DAYS',
          sentBy: 'SYSTEM',
        });

        user.whatsappRemindersSent = {
          ...user.whatsappRemindersSent,
          twoDaysBefore: now,
        };
        await user.save();
        console.log(`[ExpiryWorker] Sent 2-day reminder to student ${user.name} (${user.phone})`);
      } catch (alertErr: any) {
        console.warn(`[ExpiryWorker] Could not send 2-day reminder to ${user.name}:`, alertErr.message);
      }
    }

    // 3. Automated WhatsApp Notice: On / After Plan Expiry
    const expiredUsers = await User.find({
      planEndDate: { $lte: now },
      'whatsappRemindersSent.onExpiry': { $exists: false },
    })
      .populate('currentSeat')
      .populate('batchId')
      .populate('currentPlan');

    for (const user of expiredUsers) {
      user.entryStatus = 'EXPIRED';
      try {
        await sendWhatsAppAlert({
          adminId: user.adminId,
          user,
          templateKey: 'PLAN_EXPIRED',
          sentBy: 'SYSTEM',
        });

        user.whatsappRemindersSent = {
          ...user.whatsappRemindersSent,
          onExpiry: now,
        };
        await user.save();
        console.log(`[ExpiryWorker] Sent expired notice to student ${user.name} (${user.phone})`);
      } catch (alertErr: any) {
        console.warn(`[ExpiryWorker] Could not send expired notice to ${user.name}:`, alertErr.message);
        await user.save();
      }
    }

    // 4. Expire Seat Assignments that have ended
    const expiredAssignments = await SeatAssignment.find({
      status: 'ACTIVE',
      endDate: { $lt: now },
    });

    for (const assign of expiredAssignments) {
      assign.status = 'EXPIRED';
      await assign.save();

      // Check if any other active assignment exists for this seat
      const otherActive = await SeatAssignment.countDocuments({
        seatId: assign.seatId,
        status: 'ACTIVE',
      });

      if (otherActive === 0) {
        await Seat.findByIdAndUpdate(assign.seatId, {
          status: 'AVAILABLE',
          $unset: { assignedUserId: 1, assignedFrom: 1, assignedUntil: 1 },
        });
      }
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

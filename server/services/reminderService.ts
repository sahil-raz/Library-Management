import { ReminderLog } from '../models/ReminderLog.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Admin } from '../models/Admin.js';
import { Types } from 'mongoose';

export function formatWhatsAppNumber(phone: string): string {
  // Strip non-digits
  let cleaned = phone.replace(/\D/g, '');
  // If 10 digits (Indian standard without country code), prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const formattedNumber = formatWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedText}`;
}

export async function generateOrGetExpiryReminders(adminId: string | Types.ObjectId) {
  const adminObjectId = new Types.ObjectId(adminId.toString());
  const admin = await Admin.findById(adminObjectId);
  const libraryName = admin?.organizationName || 'our library';

  const now = new Date();
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(now.getDate() + 2);

  // Find active user subscriptions for this admin
  const activeSubs = await Subscription.find({
    adminId: adminObjectId,
    type: 'LIBRARY_USER',
    status: 'ACTIVE',
  }).populate('userId');

  const generatedReminders = [];

  for (const sub of activeSubs) {
    if (!sub.userId) continue;
    const user = sub.userId as any;
    const expiry = new Date(sub.expiresAt);
    
    // Check difference in days
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let reminderType: 'TWO_DAYS_BEFORE' | 'DAY_OF_EXPIRY' | null = null;
    let messageText = '';

    if (diffDays <= 0) {
      reminderType = 'DAY_OF_EXPIRY';
      messageText = `Dear ${user.name}, your library subscription at ${libraryName} expires today (${expiry.toLocaleDateString()}). Please renew your plan to continue accessing your seat and library facilities.`;
    } else if (diffDays <= 2) {
      reminderType = 'TWO_DAYS_BEFORE';
      messageText = `Dear ${user.name}, this is a gentle reminder that your library membership at ${libraryName} will expire in ${diffDays} day(s) on ${expiry.toLocaleDateString()}. Please renew soon.`;
    }

    if (reminderType) {
      // Check if already logged for this subscription cycle
      let existingLog = await ReminderLog.findOne({
        adminId: adminObjectId,
        userId: user._id,
        type: reminderType,
        generatedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      });

      const waLink = buildWhatsAppLink(user.whatsappNumber || user.phone, messageText);

      if (!existingLog) {
        existingLog = await ReminderLog.create({
          adminId: adminObjectId,
          userId: user._id,
          userName: user.name,
          userPhone: user.phone,
          whatsappNumber: user.whatsappNumber || user.phone,
          type: reminderType,
          status: 'GENERATED',
          waLink,
          messageText,
          generatedAt: now,
        });
      }

      generatedReminders.push(existingLog);
    }
  }

  return generatedReminders;
}

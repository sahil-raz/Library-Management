import { Types } from 'mongoose';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { ReminderLog } from '../models/ReminderLog.js';
import { checkPlanLimit } from './planLimitService.js';
import { ENV } from '../config/env.js';

export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const formattedNumber = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedText}`;
}

/**
 * Dispatch real WhatsApp notification via Official AIPlexy API
 */
export async function sendAiplexyWhatsAppMessage({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const formattedPhone = formatWhatsAppPhone(phone);

  if (!ENV.AIPLEXY_API_KEY) {
    console.warn(
      `⚠️ [AIPlexy WhatsApp] AIPLEXY_API_KEY is not configured in .env. Message to +${formattedPhone} prepared but external dispatch skipped.`
    );
    return { success: false, error: 'AIPLEXY_API_KEY not configured' };
  }

  try {
    const payload = {
      apiKey: ENV.AIPLEXY_API_KEY,
      instance_id: ENV.AIPLEXY_INSTANCE_ID || undefined,
      instanceId: ENV.AIPLEXY_INSTANCE_ID || undefined,
      sender: ENV.AIPLEXY_SENDER_NUMBER || undefined,
      to: formattedPhone,
      recipient: formattedPhone,
      phone: formattedPhone,
      number: formattedPhone,
      message,
      text: message,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ENV.AIPLEXY_API_KEY}`,
      'x-api-key': ENV.AIPLEXY_API_KEY,
    };

    console.log(`📡 [AIPlexy WhatsApp] Calling AIPlexy API for +${formattedPhone} at ${ENV.AIPLEXY_API_URL}...`);
    const response = await fetch(ENV.AIPLEXY_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      console.error(
        `❌ [AIPlexy WhatsApp] Error response (HTTP ${response.status}):`,
        responseData
      );
      return {
        success: false,
        error: `AIPlexy HTTP ${response.status}: ${JSON.stringify(responseData)}`,
      };
    }

    console.log(`✅ [AIPlexy WhatsApp] Successfully dispatched to +${formattedPhone}:`, responseData);
    return {
      success: true,
      externalId: responseData.id || responseData.messageId || responseData.msgId,
    };
  } catch (error: any) {
    console.error(`❌ [AIPlexy WhatsApp] Dispatch exception for +${formattedPhone}:`, error.message || error);
    return { success: false, error: error.message || 'Unknown network error' };
  }
}

export const WHATSAPP_TEMPLATES = {
  EXPIRY_2_DAYS: {
    id: 'EXPIRY_2_DAYS',
    title: 'Plan Expiring in 2 Days',
    template: 'Dear {studentName}, gentle reminder from {libraryName}. Your study plan will expire in 2 days on {expiryDate}. Please renew to retain your assigned Seat #{seatNumber} ({batchName}).',
  },
  PLAN_EXPIRED: {
    id: 'PLAN_EXPIRED',
    title: 'Plan Expired Notice',
    template: 'Dear {studentName}, your membership at {libraryName} expired on {expiryDate}. Please renew immediately to continue accessing your Seat #{seatNumber} ({batchName}).',
  },
  ADMISSION_WELCOME: {
    id: 'ADMISSION_WELCOME',
    title: 'Admission & Seat Confirmation',
    template: 'Welcome {studentName} to {libraryName}! Your registration is confirmed for Seat #{seatNumber} in {batchName} under plan "{planName}". Valid until {expiryDate}. Happy studying!',
  },
  PLAN_RENEWED: {
    id: 'PLAN_RENEWED',
    title: 'Membership Renewed Confirmation',
    template: 'Dear {studentName}, your library plan "{planName}" at {libraryName} has been successfully renewed! Your new membership is valid until {expiryDate}. Seat #{seatNumber} ({batchName}).',
  },
  CUSTOM: {
    id: 'CUSTOM',
    title: 'Custom Notice',
    template: '{customMessage}',
  },
};

export function renderWhatsAppMessage(
  templateKey: keyof typeof WHATSAPP_TEMPLATES | string,
  variables: Record<string, string | number>
): string {
  const tmpl = (WHATSAPP_TEMPLATES as any)[templateKey]?.template || (variables.customMessage as string) || '';
  let rendered = tmpl;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value || ''));
  }
  return rendered;
}

// Generate & record OTP for WhatsApp verification
export async function sendWhatsAppOtp(
  phone: string,
  purpose = 'ADMIN_SIGNUP'
): Promise<{ otp: string; waLink: string; sentViaAiplexy: boolean }> {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing OTPs for this phone
  await Otp.deleteMany({ phone, purpose });

  await Otp.create({
    phone,
    otp,
    purpose,
    verified: false,
    expiresAt,
  });

  const message = `Your WhatsApp verification code for Library Management portal is ${otp}. Valid for 10 minutes. Do not share this code.`;
  const waLink = buildWhatsAppLink(phone, message);

  // Send via official AIPlexy API
  const aiplexyResult = await sendAiplexyWhatsAppMessage({ phone, message });

  return { otp, waLink, sentViaAiplexy: aiplexyResult.success };
}

// Verify OTP
export async function verifyWhatsAppOtp(phone: string, otpInput: string, purpose = 'ADMIN_SIGNUP'): Promise<boolean> {
  const record = await Otp.findOne({
    phone: phone.trim(),
    otp: otpInput.trim(),
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    return false;
  }

  record.verified = true;
  await record.save();
  return true;
}

// Enforce quota and record WhatsApp alert
export async function sendWhatsAppAlert({
  adminId,
  user,
  templateKey,
  variables = {},
  sentBy = 'ADMIN',
}: {
  adminId: Types.ObjectId | string;
  user: any;
  templateKey: keyof typeof WHATSAPP_TEMPLATES | string;
  variables?: Record<string, any>;
  sentBy?: 'SYSTEM' | 'ADMIN';
}): Promise<{ success: boolean; waLink: string; messageText: string; log: any }> {
  const adminObjectId = new Types.ObjectId(adminId.toString());

  // Check quota limit from SaaS Subscription
  const quotaCheck = await checkPlanLimit(adminObjectId, 'messages');
  if (!quotaCheck.allowed) {
    throw new Error(
      `WhatsApp alert limit reached (${quotaCheck.current} / ${quotaCheck.max} sent). Please upgrade your SaaS plan to send more alerts.`
    );
  }

  const admin = await Admin.findById(adminObjectId);
  const libraryName = admin?.organizationName || 'Library';

  const defaultVars = {
    studentName: user.name,
    libraryName,
    phone: user.phone,
    seatNumber: variables.seatNumber || (user.currentSeat?.seatNumber || 'N/A'),
    batchName: variables.batchName || (user.batchId?.name || 'Standard Batch'),
    planName: variables.planName || (user.currentPlan?.name || 'Active Plan'),
    expiryDate: user.planEndDate ? new Date(user.planEndDate).toLocaleDateString() : 'N/A',
    ...variables,
  };

  const messageText = renderWhatsAppMessage(templateKey, defaultVars);
  const phone = user.whatsappNumber || user.phone;
  const waLink = buildWhatsAppLink(phone, messageText);

  // Dispatch via official AIPlexy API
  const aiplexyResult = await sendAiplexyWhatsAppMessage({ phone, message: messageText });

  // Map to reminder type
  let type: any = 'MANUAL';
  if (templateKey === 'EXPIRY_2_DAYS') type = 'TWO_DAYS_BEFORE';
  else if (templateKey === 'PLAN_EXPIRED') type = 'AFTER_EXPIRY';
  else if (templateKey === 'ADMISSION_WELCOME') type = 'ADMISSION_WELCOME';
  else if (templateKey === 'PLAN_RENEWED') type = 'PLAN_RENEWED';

  const log = await ReminderLog.create({
    adminId: adminObjectId,
    userId: user._id,
    userName: user.name,
    userPhone: user.phone,
    whatsappNumber: phone,
    type,
    templateKey,
    sentBy,
    status: aiplexyResult.success ? 'SENT' : 'PENDING_DELIVERY',
    waLink,
    messageText,
    generatedAt: new Date(),
  });

  // Increment admin counter
  await Admin.findByIdAndUpdate(adminObjectId, { $inc: { whatsappAlertsUsed: 1 } });

  return {
    success: true,
    waLink,
    messageText,
    log,
  };
}

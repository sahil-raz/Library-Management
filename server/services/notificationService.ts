import { Notification } from '../models/Notification.js';
import { Types } from 'mongoose';
import { UserRole } from '../types/index.js';

interface NotificationParams {
  recipientRole: UserRole;
  recipientId: string | Types.ObjectId;
  title: string;
  message: string;
  type?: 'EXPIRY' | 'PAYMENT' | 'SEAT' | 'SYSTEM' | 'QUEUE';
  metadata?: Record<string, any>;
}

export async function createNotification(params: NotificationParams): Promise<void> {
  try {
    await Notification.create({
      recipientRole: params.recipientRole,
      recipientId: new Types.ObjectId(params.recipientId.toString()),
      title: params.title,
      message: params.message,
      type: params.type || 'SYSTEM',
      metadata: params.metadata,
      isRead: false,
    });
  } catch (error) {
    console.error('[Notification] Failed to create notification:', error);
  }
}

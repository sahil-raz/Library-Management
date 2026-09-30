import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  recipientRole: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: 'EXPIRY' | 'PAYMENT' | 'SEAT' | 'SYSTEM' | 'QUEUE';
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientRole: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
      required: true,
      index: true,
    },
    recipientId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['EXPIRY', 'PAYMENT', 'SEAT', 'SYSTEM', 'QUEUE'],
      default: 'SYSTEM',
    },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

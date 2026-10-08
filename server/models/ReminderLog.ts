import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReminderLog extends Document {
  adminId: Types.ObjectId;
  userId?: Types.ObjectId;
  userName: string;
  userPhone: string;
  whatsappNumber: string;
  type: 'TWO_DAYS_BEFORE' | 'DAY_OF_EXPIRY' | 'AFTER_EXPIRY' | 'ADMISSION_WELCOME' | 'PLAN_RENEWED' | 'MANUAL';
  templateKey?: string;
  sentBy: 'SYSTEM' | 'ADMIN';
  status: 'GENERATED' | 'OPENED' | 'SENT';
  waLink: string;
  messageText: string;
  generatedAt: Date;
  openedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderLogSchema = new Schema<IReminderLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['TWO_DAYS_BEFORE', 'DAY_OF_EXPIRY', 'AFTER_EXPIRY', 'ADMISSION_WELCOME', 'PLAN_RENEWED', 'MANUAL'],
      default: 'MANUAL',
      index: true,
    },
    templateKey: { type: String, trim: true },
    sentBy: { type: String, enum: ['SYSTEM', 'ADMIN'], default: 'ADMIN' },
    status: {
      type: String,
      enum: ['GENERATED', 'OPENED', 'SENT'],
      default: 'GENERATED',
      index: true,
    },
    waLink: { type: String, required: true },
    messageText: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    openedAt: { type: Date },
  },
  { timestamps: true }
);

ReminderLogSchema.index({ adminId: 1, userId: 1, type: 1 });
ReminderLogSchema.index({ adminId: 1, createdAt: -1 });

export const ReminderLog = mongoose.model<IReminderLog>('ReminderLog', ReminderLogSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReminderLog extends Document {
  adminId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userPhone: string;
  whatsappNumber: string;
  type: 'TWO_DAYS_BEFORE' | 'DAY_OF_EXPIRY' | 'MANUAL';
  status: 'GENERATED' | 'OPENED';
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['TWO_DAYS_BEFORE', 'DAY_OF_EXPIRY', 'MANUAL'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['GENERATED', 'OPENED'],
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

export const ReminderLog = mongoose.model<IReminderLog>('ReminderLog', ReminderLogSchema);

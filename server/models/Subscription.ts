import mongoose, { Document, Schema, Types } from 'mongoose';
import { SubscriptionStatus } from '../types/index.js';

export interface ISubscription extends Document {
  type: 'SAAS_ADMIN' | 'LIBRARY_USER';
  adminId: Types.ObjectId;
  userId?: Types.ObjectId;
  planId: Types.ObjectId;
  planSnapshot: {
    name: string;
    price: number;
    validity: number;
    validityUnit: string;
    maxBranches?: number;
    maxManagers?: number;
    maxUsers?: number;
    maxSeats?: number;
    maxMessages?: number;
    maxQueueEntries?: number;
  };
  startDate: Date;
  expiresAt: Date;
  status: SubscriptionStatus;
  paymentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    type: { type: String, enum: ['SAAS_ADMIN', 'LIBRARY_USER'], required: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    planId: { type: Schema.Types.ObjectId, required: true },
    planSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      validity: { type: Number, required: true },
      validityUnit: { type: String, required: true },
      maxBranches: { type: Number },
      maxManagers: { type: Number },
      maxUsers: { type: Number },
      maxSeats: { type: Number },
      maxMessages: { type: Number },
      maxQueueEntries: { type: Number },
    },
    startDate: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ adminId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

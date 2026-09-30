import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentStatus } from '../types/index.js';

export interface IPayment extends Document {
  type: 'SAAS_PLAN' | 'USER_PLAN';
  adminId: Types.ObjectId;
  userId?: Types.ObjectId;
  planId: Types.ObjectId;
  planName: string;
  amount: number;
  currency: string;
  utr: string;
  screenshot?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedByRole?: string;
  reviewedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    type: { type: String, enum: ['SAAS_PLAN', 'USER_PLAN'], required: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    planId: { type: Schema.Types.ObjectId, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    utr: { type: String, required: true, trim: true, index: true },
    screenshot: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId },
    reviewedByRole: { type: String },
    reviewedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PaymentSchema.index({ adminId: 1, status: 1 });
PaymentSchema.index({ type: 1, status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

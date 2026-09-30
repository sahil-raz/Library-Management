import mongoose, { Document, Schema, Types } from 'mongoose';
import { ValidityUnit } from '../types/index.js';

export interface IUserPlan extends Document {
  adminId: Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  validity: number;
  validityUnit: ValidityUnit;
  description: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserPlanSchema = new Schema<IUserPlan>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    validity: { type: Number, required: true, min: 1 },
    validityUnit: { type: String, enum: ['Days', 'Months', 'Years'], default: 'Months', required: true },
    description: { type: String, default: '', trim: true },
    features: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

UserPlanSchema.index({ adminId: 1, name: 1 }, { unique: true });

export const UserPlan = mongoose.model<IUserPlan>('UserPlan', UserPlanSchema);

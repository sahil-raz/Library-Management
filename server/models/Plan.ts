import mongoose, { Document, Schema } from 'mongoose';
import { ValidityUnit } from '../types/index.js';

export interface IPlan extends Document {
  name: string;
  price: number;
  currency: string;
  validity: number;
  validityUnit: ValidityUnit;
  features: string[];
  maxBranches: number;
  maxManagers: number;
  maxUsers: number;
  maxSeats: number;
  maxMessages: number;
  maxQueueEntries: number;
  maxStorageMB: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    validity: { type: Number, required: true, min: 1 },
    validityUnit: { type: String, enum: ['Days', 'Months', 'Years'], default: 'Months', required: true },
    features: [{ type: String, trim: true }],
    maxBranches: { type: Number, required: true, min: 1, default: 1 },
    maxManagers: { type: Number, required: true, min: 1, default: 2 },
    maxUsers: { type: Number, required: true, min: 1, default: 100 },
    maxSeats: { type: Number, required: true, min: 1, default: 50 },
    maxMessages: { type: Number, required: true, min: 0, default: 500 },
    maxQueueEntries: { type: Number, required: true, min: 0, default: 50 },
    maxStorageMB: { type: Number, required: true, min: 10, default: 1024 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

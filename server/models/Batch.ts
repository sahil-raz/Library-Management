import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBatch extends Document {
  adminId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  startTime: string; // e.g., "08:00 AM" or "08:00"
  endTime: string;   // e.g., "01:00 PM" or "13:00"
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BatchSchema.index({ adminId: 1, name: 1 }, { unique: true });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);

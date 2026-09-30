import mongoose, { Document, Schema, Types } from 'mongoose';
import { SeatStatus } from '../types/index.js';

export interface ISeat extends Document {
  adminId: Types.ObjectId;
  branchId: Types.ObjectId;
  seatNumber: string;
  status: SeatStatus;
  assignedUserId?: Types.ObjectId;
  assignedFrom?: Date;
  assignedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SeatSchema = new Schema<ISeat>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    seatNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'BLOCKED'],
      default: 'AVAILABLE',
      index: true,
    },
    assignedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedFrom: { type: Date },
    assignedUntil: { type: Date },
  },
  { timestamps: true }
);

SeatSchema.index({ branchId: 1, seatNumber: 1 }, { unique: true });
SeatSchema.index({ adminId: 1, status: 1 });

export const Seat = mongoose.model<ISeat>('Seat', SeatSchema);

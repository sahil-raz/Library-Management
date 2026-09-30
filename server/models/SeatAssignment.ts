import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISeatAssignment extends Document {
  adminId: Types.ObjectId;
  branchId: Types.ObjectId;
  seatId: Types.ObjectId;
  userId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'RELEASED';
  assignedBy: Types.ObjectId;
  assignedByRole: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeatAssignmentSchema = new Schema<ISeatAssignment>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    seatId: { type: Schema.Types.ObjectId, ref: 'Seat', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'RELEASED'],
      default: 'ACTIVE',
      index: true,
    },
    assignedBy: { type: Schema.Types.ObjectId, required: true },
    assignedByRole: { type: String, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SeatAssignment = mongoose.model<ISeatAssignment>('SeatAssignment', SeatAssignmentSchema);

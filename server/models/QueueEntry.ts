import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQueueEntry extends Document {
  adminId: Types.ObjectId;
  branchId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'WAITING' | 'PROMOTED' | 'REMOVED';
  priority: number;
  notes?: string;
  addedBy: Types.ObjectId;
  addedByRole: string;
  promotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QueueEntrySchema = new Schema<IQueueEntry>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['WAITING', 'PROMOTED', 'REMOVED'],
      default: 'WAITING',
      index: true,
    },
    priority: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    addedBy: { type: Schema.Types.ObjectId, required: true },
    addedByRole: { type: String, required: true },
    promotedAt: { type: Date },
  },
  { timestamps: true }
);

QueueEntrySchema.index({ branchId: 1, status: 1, createdAt: 1 });

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', QueueEntrySchema);

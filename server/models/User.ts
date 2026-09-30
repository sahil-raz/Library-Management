import mongoose, { Document, Schema, Types } from 'mongoose';
import { EntryStatus } from '../types/index.js';

export interface IUser extends Document {
  adminId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  photo?: string;
  password: string;
  entryStatus: EntryStatus;
  currentSubscription?: Types.ObjectId;
  currentSeat?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    photo: { type: String, trim: true },
    password: { type: String, required: true },
    entryStatus: {
      type: String,
      enum: ['NONE', 'QUEUE', 'ACTIVE', 'EXPIRED', 'SUSPENDED'],
      default: 'NONE',
      index: true,
    },
    currentSubscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    currentSeat: { type: Schema.Types.ObjectId, ref: 'Seat' },
  },
  { timestamps: true }
);

// Allow same email in different library orgs if needed, but unique per library org
UserSchema.index({ adminId: 1, email: 1 }, { unique: true });
UserSchema.index({ adminId: 1, phone: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

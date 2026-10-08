import mongoose, { Document, Schema, Types } from 'mongoose';
import { EntryStatus } from '../types/index.js';

export interface IUser extends Document {
  adminId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  phone: string;
  classCourse?: string;
  address?: string;
  photo?: string;
  parentName: string;
  parentPhone: string;
  aadharNumber?: string;
  dateOfBirth?: Date;
  gender: 'Male' | 'Female' | 'Other';
  
  // Library Assignment & Subscriptions
  batchId?: Types.ObjectId;
  currentSeat?: Types.ObjectId;
  currentPlan?: Types.ObjectId;
  currentSubscription?: Types.ObjectId;
  planStartDate?: Date;
  planEndDate?: Date;
  idCardNumber?: string;
  
  // Expiry notification state
  whatsappRemindersSent?: {
    twoDaysBefore?: Date;
    onExpiry?: Date;
  };

  // Optional legacy fields
  email?: string;
  password?: string;
  whatsappNumber?: string;
  emergencyContact?: string;
  
  entryStatus: EntryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    classCourse: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    photo: { type: String, trim: true, default: '' },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    aadharNumber: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },

    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', index: true },
    currentSeat: { type: Schema.Types.ObjectId, ref: 'Seat', index: true },
    currentPlan: { type: Schema.Types.ObjectId, ref: 'UserPlan', index: true },
    currentSubscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    planStartDate: { type: Date },
    planEndDate: { type: Date, index: true },
    idCardNumber: { type: String, trim: true, index: true },

    whatsappRemindersSent: {
      twoDaysBefore: { type: Date },
      onExpiry: { type: Date },
    },

    email: { type: String, lowercase: true, trim: true },
    password: { type: String },
    whatsappNumber: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },

    entryStatus: {
      type: String,
      enum: ['NONE', 'QUEUE', 'ACTIVE', 'EXPIRED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

// Student phone must be unique within an admin library
UserSchema.index({ adminId: 1, phone: 1 }, { unique: true });
UserSchema.index({ adminId: 1, planEndDate: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

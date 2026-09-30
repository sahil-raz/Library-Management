import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAdmin extends Document {
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  password: string;
  organizationName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  currentSubscription?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    organizationName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], default: 'ACTIVE', index: true },
    currentSubscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ISuperAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SuperAdminSchema = new Schema<ISuperAdmin>(
  {
    name: { type: String, required: true, trim: true, default: 'Platform Super Admin' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SuperAdmin = mongoose.model<ISuperAdmin>('SuperAdmin', SuperAdminSchema);

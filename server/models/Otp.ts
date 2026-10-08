import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  otp: string;
  purpose: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, index: true, trim: true },
    otp: { type: String, required: true, trim: true },
    purpose: { type: String, default: 'ADMIN_SIGNUP', trim: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete on expire
  },
  { timestamps: true }
);

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);

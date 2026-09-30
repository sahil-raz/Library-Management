import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaymentConfig extends Document {
  scope: 'SUPERADMIN' | 'ADMIN';
  adminId?: Types.ObjectId; // null for SUPERADMIN
  upiId: string;
  qrCode?: string;
  paymentName: string;
  paymentInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentConfigSchema = new Schema<IPaymentConfig>(
  {
    scope: { type: String, enum: ['SUPERADMIN', 'ADMIN'], required: true, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', index: true },
    upiId: { type: String, required: true, trim: true },
    qrCode: { type: String, trim: true },
    paymentName: { type: String, required: true, trim: true },
    paymentInstructions: { type: String, default: 'Scan the QR code or send payment directly to the UPI ID. Once completed, enter the UTR/transaction reference and submit screenshot for verification.', trim: true },
  },
  { timestamps: true }
);

PaymentConfigSchema.index({ scope: 1, adminId: 1 }, { unique: true });

export const PaymentConfig = mongoose.model<IPaymentConfig>('PaymentConfig', PaymentConfigSchema);

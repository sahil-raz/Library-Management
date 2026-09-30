import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
  sessionTokenHash: string; // SHA-256 hash of the bearer token
  deviceId: string; // Client-provided device identifier
  deviceFingerprint: string; // SHA-256 hash of deviceId + userAgent
  deviceInfo: {
    ip?: string;
    userAgent?: string;
  };
  isValid: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
      required: true,
      index: true,
    },
    sessionTokenHash: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, index: true },
    deviceFingerprint: { type: String, required: true, index: true },
    deviceInfo: {
      ip: { type: String, trim: true },
      userAgent: { type: String, trim: true },
    },
    isValid: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Automatic expiration index to clean up stale sessions from MongoDB after expiry
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);

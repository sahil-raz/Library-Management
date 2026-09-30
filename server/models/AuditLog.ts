import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  actorRole: string;
  actorName: string;
  adminId?: Types.ObjectId;
  branchId?: Types.ObjectId;
  action: string;
  target: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorRole: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    action: { type: String, required: true, index: true },
    target: { type: String, required: true },
    targetId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

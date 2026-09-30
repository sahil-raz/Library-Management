import { AuditLog } from '../models/AuditLog.js';
import { Types } from 'mongoose';

interface AuditLogParams {
  actorId: string | Types.ObjectId;
  actorRole: string;
  actorName: string;
  adminId?: string | Types.ObjectId;
  branchId?: string | Types.ObjectId;
  action: string;
  target: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      actorId: new Types.ObjectId(params.actorId.toString()),
      actorRole: params.actorRole,
      actorName: params.actorName,
      adminId: params.adminId ? new Types.ObjectId(params.adminId.toString()) : undefined,
      branchId: params.branchId ? new Types.ObjectId(params.branchId.toString()) : undefined,
      action: params.action,
      target: params.target,
      targetId: params.targetId,
      ip: params.ip,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error);
  }
}

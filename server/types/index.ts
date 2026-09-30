import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  adminId?: string; // For ADMIN (self), MANAGER, USER
  branchId?: string; // For MANAGER, and optionally USER
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export type ValidityUnit = 'Days' | 'Months' | 'Years';

export interface PlanLimits {
  maxBranches: number;
  maxManagers: number;
  maxUsers: number;
  maxSeats: number;
  maxMessages: number;
  maxQueueEntries: number;
  maxStorageMB: number;
}

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SeatStatus = 'AVAILABLE' | 'ASSIGNED' | 'BLOCKED';
export type EntryStatus = 'NONE' | 'QUEUE' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface ManagerPermissionSet {
  users_view: boolean;
  users_create: boolean;
  users_edit: boolean;
  seats_view: boolean;
  seats_assign: boolean;
  queue_manage: boolean;
  entries_manage: boolean;
  payments_view: boolean;
  expenses_manage: boolean;
  expenses_add: boolean;
  expenses_view: boolean;
  reminders_send: boolean;
  dashboard_view: boolean;
}

export type PermissionKey = keyof ManagerPermissionSet;

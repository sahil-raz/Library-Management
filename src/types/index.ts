export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SeatStatus = 'AVAILABLE' | 'ASSIGNED' | 'BLOCKED';
export type EntryStatus = 'NONE' | 'QUEUE' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
export type ValidityUnit = 'Days' | 'Months' | 'Years';

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

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  whatsappNumber?: string;
  organizationName?: string;
  adminId?: string;
  branchId?: string | { _id: string; name: string; address: string };
  currentSeat?: { _id: string; seatNumber: string };
  entryStatus?: EntryStatus;
  mustChangePassword?: boolean;
  permissions?: ManagerPermissionSet;
  subscription?: Subscription;
}

export interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  validity: number;
  validityUnit: ValidityUnit;
  features: string[];
  maxBranches: number;
  maxManagers: number;
  maxUsers: number;
  maxSeats: number;
  maxMessages: number;
  maxQueueEntries: number;
  maxStorageMB: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserPlan {
  _id: string;
  adminId: string;
  name: string;
  price: number;
  currency: string;
  validity: number;
  validityUnit: ValidityUnit;
  description?: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  type: 'SAAS_ADMIN' | 'LIBRARY_USER';
  adminId: string;
  userId?: string;
  planId: string;
  planSnapshot: {
    name: string;
    price: number;
    validity: number;
    validityUnit: string;
    maxBranches?: number;
    maxManagers?: number;
    maxUsers?: number;
    maxSeats?: number;
    maxMessages?: number;
    maxQueueEntries?: number;
  };
  startDate: string;
  expiresAt: string;
  status: SubscriptionStatus;
}

export interface PaymentConfig {
  _id: string;
  scope: 'SUPERADMIN' | 'ADMIN';
  adminId?: string;
  upiId: string;
  qrCode?: string;
  paymentName: string;
  paymentInstructions?: string;
}

export interface Payment {
  _id: string;
  type: 'SAAS_PLAN' | 'USER_PLAN';
  adminId: any;
  userId?: any;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  utr: string;
  screenshot?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Branch {
  _id: string;
  adminId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  status: 'ACTIVE' | 'INACTIVE';
  seatCount?: number;
  assignedSeatCount?: number;
  userCount?: number;
  manager?: { name: string; email: string; phone: string };
  createdAt: string;
}

export interface Manager {
  _id: string;
  adminId: string;
  branchId: any;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions?: ManagerPermissionSet;
  createdAt: string;
}

export interface Seat {
  _id: string;
  adminId: string;
  branchId: any;
  seatNumber: string;
  status: SeatStatus;
  assignedUserId?: any;
  assignedFrom?: string;
  assignedUntil?: string;
  createdAt: string;
}

export interface UserItem {
  _id: string;
  adminId: string;
  branchId?: any;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  entryStatus: EntryStatus;
  currentSeat?: any;
  currentSubscription?: any;
  createdAt: string;
}

export interface QueueItem {
  _id: string;
  adminId: string;
  branchId: any;
  userId: any;
  status: 'WAITING' | 'PROMOTED' | 'REMOVED';
  priority: number;
  notes?: string;
  createdAt: string;
}

export interface ExpenseItem {
  _id: string;
  adminId: string;
  branchId: any;
  title: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  recordedByRole: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditItem {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  targetId?: string;
  ip?: string;
  createdAt: string;
  metadata?: any;
}

export interface PlanUsageStats {
  hasActivePlan: boolean;
  planName: string;
  expiresAt?: string;
  daysRemaining?: number;
  branches: { current: number; max: number };
  managers: { current: number; max: number };
  users: { current: number; max: number };
  seats: { current: number; max: number };
  messages: { current: number; max: number };
  queue: { current: number; max: number };
}

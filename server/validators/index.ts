import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required').trim(),
  email: z.string().email('Invalid email address').optional(),
});

export const adminRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  phone: z.string().min(10, 'Valid phone number is required').trim(),
  whatsappNumber: z.string().min(10).trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  organizationName: z.string().min(2, 'Organization name is required').trim(),
  otp: z.string().min(4, 'WhatsApp verification OTP is required').trim(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Admin adding student/user
export const createStudentSchema = z.object({
  name: z.string().min(2, 'Student name is required').trim(),
  phone: z.string().min(10, 'Student phone number is required').trim(),
  classCourse: z.string().optional().default(''),
  address: z.string().optional().default(''),
  photo: z.string().optional().default(''),
  parentName: z.string().min(2, 'Parent / Guardian name is required').trim(),
  parentPhone: z.string().min(10, 'Parent phone number is required').trim(),
  aadharNumber: z.string().optional().default(''),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).default('Male'),
  branchId: z.string().min(1, 'Branch selection is required'),
  batchId: z.string().min(1, 'Batch / session timing is required'),
  seatId: z.string().min(1, 'Seat selection is required'),
  planId: z.string().min(1, 'Admin plan selection is required'),
  email: z.string().email().optional(),
});

// Legacy backward-compatibility alias
export const userRegisterSchema = createStudentSchema.partial({
  parentName: true,
  parentPhone: true,
  branchId: true,
  batchId: true,
  seatId: true,
  planId: true,
}).extend({
  name: z.string().min(2).trim(),
  phone: z.string().min(10).trim(),
  password: z.string().optional(),
  adminId: z.string().optional(),
});

export const batchSchema = z.object({
  name: z.string().min(2, 'Batch name is required').trim(),
  startTime: z.string().min(1, 'Start time is required').trim(),
  endTime: z.string().min(1, 'End time is required').trim(),
  branchId: z.string().optional(),
  description: z.string().optional().default(''),
});

export const renewPlanSchema = z.object({
  planId: z.string().min(1, 'Plan selection is required'),
  paymentMode: z.string().optional().default('CASH'),
  notes: z.string().optional(),
});

export const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required').trim(),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('INR'),
  validity: z.number().min(1, 'Validity must be at least 1'),
  validityUnit: z.enum(['Days', 'Months', 'Years']),
  features: z.array(z.string()).default([]),
  maxBranches: z.number().min(1, 'At least 1 branch allowed'),
  maxManagers: z.number().min(1, 'At least 1 manager allowed'),
  maxUsers: z.number().min(1, 'At least 1 user allowed'),
  maxSeats: z.number().min(1, 'At least 1 seat allowed'),
  maxMessages: z.number().min(0).default(500),
  maxQueueEntries: z.number().min(0).default(50),
  maxStorageMB: z.number().min(10).default(1024),
  isActive: z.boolean().default(true),
});

export const userPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required').trim(),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('INR'),
  validity: z.number().min(1, 'Validity must be at least 1'),
  validityUnit: z.enum(['Days', 'Months', 'Years']),
  description: z.string().optional().default(''),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').trim(),
  address: z.string().min(3, 'Address is required').trim(),
  phone: z.string().min(10, 'Valid phone is required').trim(),
  email: z.string().email('Valid email is required').trim().toLowerCase(),
  openingTime: z.string().min(1, 'Opening time is required').trim(),
  closingTime: z.string().min(1, 'Closing time is required').trim(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const managerSchema = z.object({
  name: z.string().min(2, 'Name is required').trim(),
  email: z.string().email('Valid email is required').trim().toLowerCase(),
  phone: z.string().min(10, 'Valid phone is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  branchId: z.string().min(1, 'Assigned branch ID is required'),
});

export const managerPermissionsSchema = z.object({
  users_view: z.boolean().default(true),
  users_create: z.boolean().default(false),
  users_edit: z.boolean().default(false),
  seats_view: z.boolean().default(true),
  seats_assign: z.boolean().default(false),
  queue_manage: z.boolean().default(false),
  entries_manage: z.boolean().default(false),
  payments_view: z.boolean().default(false),
  expenses_manage: z.boolean().default(false),
  expenses_add: z.boolean().default(false),
  expenses_view: z.boolean().default(true),
  reminders_send: z.boolean().default(false),
  dashboard_view: z.boolean().default(true),
});

export const seatSchema = z.object({
  seatNumber: z.string().min(1, 'Seat number is required').trim(),
  branchId: z.string().min(1, 'Branch ID is required'),
});

export const assignSeatSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required'),
  batchId: z.string().min(1, 'Batch ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  title: z.string().min(2, 'Expense title is required').trim(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional().default('General'),
});

export const queueEntrySchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  priority: z.number().default(0),
  notes: z.string().optional(),
});

export const paymentConfigSchema = z.object({
  upiId: z.string().min(3, 'Valid UPI ID is required').trim(),
  qrCode: z.string().optional(),
  paymentName: z.string().min(2, 'Payment name is required').trim(),
  paymentInstructions: z.string().optional(),
});

export const submitPaymentSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  utr: z.string().min(4, 'UTR / Transaction ID is required').trim(),
  screenshot: z.string().optional(),
  branchId: z.string().optional(),
});

export const reviewPaymentSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export const sendWhatsAppSchema = z.object({
  userId: z.string().min(1, 'Student ID is required'),
  templateKey: z.string().min(1, 'Template key is required'),
  customMessage: z.string().optional(),
});

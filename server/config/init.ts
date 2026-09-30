import bcrypt from 'bcryptjs';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { PaymentConfig } from '../models/PaymentConfig.js';
import { Plan } from '../models/Plan.js';
import { ENV } from './env.js';

export async function initializeSystem(): Promise<void> {
  try {
    // 1. Check and create default SuperAdmin
    const existingSuperAdmin = await SuperAdmin.findOne();
    if (!existingSuperAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ENV.SUPERADMIN_PASSWORD, salt);

      await SuperAdmin.create({
        name: ENV.SUPERADMIN_NAME,
        email: ENV.SUPERADMIN_EMAIL,
        password: hashedPassword,
        mustChangePassword: true,
      });
    }

    // 2. Check and create default SuperAdmin PaymentConfig
    const existingPaymentConfig = await PaymentConfig.findOne({ scope: 'SUPERADMIN' });
    if (!existingPaymentConfig) {
      await PaymentConfig.create({
        scope: 'SUPERADMIN',
        upiId: 'superadmin@upi',
        paymentName: 'Libr Platform',
        paymentInstructions: 'Transfer the plan subscription fee to the UPI ID or scan QR code. Then submit your 12-digit UTR and payment screenshot for instant account approval.',
      });
    }

    // 3. Check and create starter plans if none exist so new admins have plans available
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.create([
        {
          name: 'Starter Library',
          price: 999,
          currency: 'INR',
          validity: 30,
          validityUnit: 'Days',
          features: [
            'Up to 1 Branch',
            'Up to 2 Managers',
            'Up to 100 Students/Patrons',
            'Up to 50 Seats',
            'Queue Management',
            'WhatsApp Reminders',
          ],
          maxBranches: 1,
          maxManagers: 2,
          maxUsers: 100,
          maxSeats: 50,
          maxMessages: 500,
          maxQueueEntries: 50,
          maxStorageMB: 500,
          isActive: true,
        },
        {
          name: 'Growth Pro',
          price: 2499,
          currency: 'INR',
          validity: 30,
          validityUnit: 'Days',
          features: [
            'Up to 3 Branches',
            'Up to 6 Managers',
            'Up to 500 Students/Patrons',
            'Up to 250 Seats',
            'Queue Management',
            'WhatsApp Reminders',
            'Expense Tracking',
          ],
          maxBranches: 3,
          maxManagers: 6,
          maxUsers: 500,
          maxSeats: 250,
          maxMessages: 2000,
          maxQueueEntries: 200,
          maxStorageMB: 2048,
          isActive: true,
        },
        {
          name: 'Enterprise Multi-Chain',
          price: 5999,
          currency: 'INR',
          validity: 30,
          validityUnit: 'Days',
          features: [
            'Up to 10 Branches',
            'Up to 20 Managers',
            'Up to 2,000 Students/Patrons',
            'Up to 1,000 Seats',
            'Unlimited Queue',
            'Priority WhatsApp Reminders',
            'Custom Staff Permissions',
            'Full Audit Trail',
          ],
          maxBranches: 10,
          maxManagers: 20,
          maxUsers: 2000,
          maxSeats: 1000,
          maxMessages: 10000,
          maxQueueEntries: 1000,
          maxStorageMB: 10240,
          isActive: true,
        },
      ]);
    }
  } catch (error) {
    console.error('❌ [Init] System initialization error:', error);
  }
}

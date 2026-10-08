import { Router } from 'express';
import {
  getDashboard,
  getAvailableSaaSPlans,
  purchaseSaaSPlan,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getManagers,
  createManager,
  updateManagerPermissions,
  deleteManager,
  getUserPlans,
  createUserPlan,
  updateUserPlan,
  deleteUserPlan,
  getSeats,
  getSeatBatchDetails,
  createSeat,
  deleteSeat,
  getUsers,
  createUser,
  renewUserPlan,
  getStudentIdCard,
  updateUserEntryStatus,
  getWhatsAppTemplates,
  sendManualWhatsApp,
  getQueue,
  addToQueue,
  promoteQueueUser,
  removeFromQueue,
  getExpenses,
  createExpense,
  getPayments,
  reviewPayment,
  getPaymentConfig,
  updatePaymentConfig,
  getWhatsAppReminders,
  markReminderOpened,
  getAuditLogs,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { enforcePlanLimit } from '../middleware/planLimit.js';

const router = Router();

// Protect all Admin endpoints
router.use(authenticate, requireRole('ADMIN'));

// Dashboard & SaaS Subscription
router.get('/dashboard', getDashboard);
router.get('/saas-plans', getAvailableSaaSPlans);
router.post('/saas-plans/purchase', purchaseSaaSPlan);

// Batches / Session Timings
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.patch('/batches/:batchId', updateBatch);
router.delete('/batches/:batchId', deleteBatch);

// Branches
router.get('/branches', getBranches);
router.post('/branches', enforcePlanLimit('branches'), createBranch);
router.patch('/branches/:branchId', updateBranch);
router.delete('/branches/:branchId', deleteBranch);

// Managers & Permissions
router.get('/managers', getManagers);
router.post('/managers', enforcePlanLimit('managers'), createManager);
router.patch('/managers/:managerId/permissions', updateManagerPermissions);
router.delete('/managers/:managerId', deleteManager);

// User Subscription Plans
router.get('/plans', getUserPlans);
router.post('/plans', createUserPlan);
router.patch('/plans/:planId', updateUserPlan);
router.delete('/plans/:planId', deleteUserPlan);

// Seats (Timing & Batch Based)
router.get('/seats', getSeats);
router.get('/seats/:seatId/details', getSeatBatchDetails);
router.post('/seats', enforcePlanLimit('seats'), createSeat);
router.delete('/seats/:seatId', deleteSeat);

// Students / Users
router.get('/users', getUsers);
router.post('/users', enforcePlanLimit('users'), createUser);
router.post('/users/:userId/renew-plan', renewUserPlan);
router.get('/users/:userId/id-card', getStudentIdCard);
router.patch('/users/:userId/entry-status', updateUserEntryStatus);

// WhatsApp Notifications & Templates
router.get('/whatsapp/templates', getWhatsAppTemplates);
router.post('/whatsapp/send', sendManualWhatsApp);

// Queue Management
router.get('/queue', getQueue);
router.post('/queue', enforcePlanLimit('queue'), addToQueue);
router.post('/queue/:queueId/promote', promoteQueueUser);
router.delete('/queue/:queueId', removeFromQueue);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);

// Patron Payments Review
router.get('/payments', getPayments);
router.post('/payments/:paymentId/review', reviewPayment);

// Payment UPI/QR configuration for users
router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', updatePaymentConfig);

// WhatsApp Reminders & Logs
router.get('/reminders', getWhatsAppReminders);
router.post('/reminders/:reminderId/open', markReminderOpened);

// Audit Logs
router.get('/audit', getAuditLogs);

export default router;

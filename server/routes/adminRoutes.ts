import { Router } from 'express';
import {
  getDashboard,
  getAvailableSaaSPlans,
  purchaseSaaSPlan,
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
  createSeat,
  assignSeat,
  unassignSeat,
  deleteSeat,
  getUsers,
  createUser,
  updateUserEntryStatus,
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

// Seats
router.get('/seats', getSeats);
router.post('/seats', enforcePlanLimit('seats'), createSeat);
router.post('/seats/assign', assignSeat);
router.post('/seats/:seatId/unassign', unassignSeat);
router.delete('/seats/:seatId', deleteSeat);

// Users / Patrons
router.get('/users', getUsers);
router.post('/users', enforcePlanLimit('users'), createUser);
router.patch('/users/:userId/entry-status', updateUserEntryStatus);

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

// WhatsApp Reminders
router.get('/reminders', getWhatsAppReminders);
router.post('/reminders/:reminderId/open', markReminderOpened);

// Audit Logs
router.get('/audit', getAuditLogs);

export default router;

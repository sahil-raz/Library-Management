import { Router } from 'express';
import {
  getDashboard,
  getBranchUsers,
  createBranchUser,
  getBranchSeats,
  assignBranchSeat,
  getBranchQueue,
  addBranchQueue,
  promoteBranchQueue,
  getBranchExpenses,
  createBranchExpense,
} from '../controllers/managerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { checkPermission } from '../middleware/managerPermission.js';

const router = Router();

// Protect all Manager endpoints
router.use(authenticate, requireRole('MANAGER'));

router.get('/dashboard', checkPermission('dashboard_view'), getDashboard);

// Users
router.get('/users', checkPermission('users_view'), getBranchUsers);
router.post('/users', checkPermission('users_create'), createBranchUser);

// Seats
router.get('/seats', checkPermission('seats_view'), getBranchSeats);
router.post('/seats/assign', checkPermission('seats_assign'), assignBranchSeat);

// Queue
router.get('/queue', checkPermission('queue_manage'), getBranchQueue);
router.post('/queue', checkPermission('queue_manage'), addBranchQueue);
router.post('/queue/:queueId/promote', checkPermission('entries_manage'), promoteBranchQueue);

// Expenses
router.get('/expenses', checkPermission('expenses_view'), getBranchExpenses);
router.post('/expenses', checkPermission('expenses_add'), createBranchExpense);

export default router;

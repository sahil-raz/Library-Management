import { Router } from 'express';
import {
  getDashboard,
  getAvailablePlans,
  submitPayment,
  getMyPayments,
  getNotifications,
  markNotificationRead,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.use(authenticate, requireRole('USER'));

router.get('/dashboard', getDashboard);
router.get('/plans', getAvailablePlans);
router.post('/payments', submitPayment);
router.get('/payments', getMyPayments);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;

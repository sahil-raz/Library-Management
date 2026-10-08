import { Router } from 'express';
import {
  sendAdminOtp,
  registerAdmin,
  registerUser,
  getPublicLibraries,
  getPublicLibraryPlans,
  getPublicPaymentConfig,
  getPublicSiteSettings,
} from '../controllers/publicController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/site-settings', getPublicSiteSettings);
router.get('/config', getPublicSiteSettings);
router.post('/admin/send-otp', authLimiter, sendAdminOtp);
router.post('/admin/register', authLimiter, registerAdmin);
router.post('/user/register', authLimiter, registerUser);
router.post('/register', authLimiter, registerUser);
router.get('/libraries', getPublicLibraries);
router.get('/libraries/:adminId/plans', getPublicLibraryPlans);
router.get('/payment-config', getPublicPaymentConfig);

export default router;

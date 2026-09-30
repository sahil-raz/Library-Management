import { Router } from 'express';
import {
  getDashboardMetrics,
  getAdmins,
  getAdminDetail,
  updateAdminStatus,
  getSaaSPlans,
  createSaaSPlan,
  updateSaaSPlan,
  deleteSaaSPlan,
  getAdminPayments,
  reviewAdminPayment,
  getSuperAdminPaymentConfig,
  updateSuperAdminPaymentConfig,
  getAuditLogs,
  getImgbbKeys,
  addImgbbKey,
  removeImgbbKey,
  testImgbbKey,
  getPlatformSiteSettings,
  updatePlatformSiteSettings,
} from '../controllers/superAdminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// Protect all SuperAdmin endpoints
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/metrics', getDashboardMetrics);
router.get('/dashboard', getDashboardMetrics);
router.get('/admins', getAdmins);
router.get('/admins/:adminId', getAdminDetail);
router.patch('/admins/:adminId/status', updateAdminStatus);

// SaaS Plans
router.get('/plans', getSaaSPlans);
router.post('/plans', createSaaSPlan);
router.patch('/plans/:planId', updateSaaSPlan);
router.delete('/plans/:planId', deleteSaaSPlan);

// Payments Review
router.get('/payments', getAdminPayments);
router.post('/payments/:paymentId/review', reviewAdminPayment);

// Payment UPI/QR configuration
router.get('/payment-config', getSuperAdminPaymentConfig);
router.put('/payment-config', updateSuperAdminPaymentConfig);

// ImgBB CDN API Key Management
router.get('/imgbb-keys', getImgbbKeys);
router.post('/imgbb-keys', addImgbbKey);
router.delete('/imgbb-keys', removeImgbbKey);
router.post('/imgbb-keys/test', testImgbbKey);

// Platform Branding & Site Settings
router.get('/site-settings', getPlatformSiteSettings);
router.put('/site-settings', updatePlatformSiteSettings);

// System Activity / Audit
router.get('/activity', getAuditLogs);

export default router;

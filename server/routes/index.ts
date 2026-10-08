import { Router } from 'express';
import authRoutes from './authRoutes.js';
import publicRoutes from './publicRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import adminRoutes from './adminRoutes.js';
import managerRoutes from './managerRoutes.js';
import userRoutes from './userRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/superadmin', superAdminRoutes);
router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);
router.use('/user', userRoutes);
router.use('/upload', uploadRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Library API',
  });
});

export default router;

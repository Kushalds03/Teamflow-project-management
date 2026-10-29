import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';

const router = Router();

// Mount Health Check under /api/health
router.use('/', healthRoutes);

// Mount Authentication under /api/auth
router.use('/auth', authRoutes);

export default router;

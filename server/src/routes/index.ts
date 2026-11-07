import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import commentRoutes from './comment.routes';
import workspaceRoutes from './workspace.routes';
import analyticsRoutes from './analytics.routes';
import userRoutes from './user.routes';

const router = Router();

// Mount Health Check under /api/health
router.use('/', healthRoutes);

// Mount Authentication under /api/auth
router.use('/auth', authRoutes);

// Mount Workspaces under /api/workspaces
router.use('/workspaces', workspaceRoutes);

// Mount Projects under /api/projects
router.use('/projects', projectRoutes);

// Mount Tasks under /api/tasks
router.use('/tasks', taskRoutes);

// Mount Comments under /api/comments
router.use('/comments', commentRoutes);

// Mount Analytics under /api/analytics
router.use('/analytics', analyticsRoutes);

// Mount Users under /api/users
router.use('/users', userRoutes);

export default router;

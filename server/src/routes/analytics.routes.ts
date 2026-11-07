import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireProjectAccess } from '../middleware/rbac.middleware';
import { validateParams } from '../middleware/validate.middleware';
import { ProjectRole } from '@prisma/client';
import {
  projectAnalyticsParamSchema,
  workspaceAnalyticsParamSchema
} from '../validators/analytics.validator';
import {
  getProjectAnalytics,
  getWorkspaceAnalytics
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

/**
 * GET /api/analytics/projects/:projectId
 * Alternate direct route for project analytics
 */
router.get(
  '/projects/:projectId',
  validateParams(projectAnalyticsParamSchema),
  requireProjectAccess(ProjectRole.VIEWER),
  getProjectAnalytics
);

/**
 * GET /api/analytics/workspaces/:workspaceId
 * Alternate direct route for workspace analytics
 */
router.get(
  '/workspaces/:workspaceId',
  validateParams(workspaceAnalyticsParamSchema),
  getWorkspaceAnalytics
);

export default router;

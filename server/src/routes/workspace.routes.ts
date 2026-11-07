import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validate.middleware';
import { workspaceAnalyticsParamSchema } from '../validators/analytics.validator';
import { getWorkspaceAnalytics } from '../controllers/analytics.controller';
import { listWorkspaces } from '../controllers/workspace.controller';

const router = Router();

// All workspace routes require an authenticated session
router.use(requireAuth);

/**
 * GET /api/workspaces
 * List all workspaces accessible to the user
 */
router.get('/', listWorkspaces);

/**
 * GET /api/workspaces/:workspaceId/analytics
 * Retrieve aggregated analytics for a workspace
 */
router.get(
  '/:workspaceId/analytics',
  validateParams(workspaceAnalyticsParamSchema),
  getWorkspaceAnalytics
);

export default router;

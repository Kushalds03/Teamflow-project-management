import { Router } from 'express';
import { ProjectRole } from '@prisma/client';
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember
} from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireProjectAccess } from '../middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  projectIdParamSchema,
  listProjectsQuerySchema
} from '../validators/project.validator';
import { createTask, listTasks } from '../controllers/task.controller';
import { projectTasksParamSchema, createTaskSchema } from '../validators/task.validator';
import { listProjectActivities } from '../controllers/activity.controller';
import { projectActivitiesParamSchema, listActivitiesQuerySchema } from '../validators/activity.validator';
import { getProjectAnalytics } from '../controllers/analytics.controller';
import { projectAnalyticsParamSchema } from '../validators/analytics.validator';

const router = Router();

// Enforce authentication on all project endpoints
router.use(requireAuth);

/**
 * GET /api/projects
 * List projects accessible to the authenticated user.
 */
router.get(
  '/',
  validateQuery(listProjectsQuerySchema),
  listProjects
);

/**
 * POST /api/projects
 * Create a new project.
 */
router.post(
  '/',
  validateBody(createProjectSchema),
  createProject
);

/**
 * GET /api/projects/:id
 * Get detailed project information (requires VIEWER role or higher).
 */
router.get(
  '/:id',
  validateParams(projectIdParamSchema),
  requireProjectAccess(ProjectRole.VIEWER),
  getProjectById
);

/**
 * PUT /api/projects/:id
 * Update project details (requires MAINTAINER role or higher).
 */
router.put(
  '/:id',
  validateParams(projectIdParamSchema),
  requireProjectAccess(ProjectRole.MAINTAINER),
  validateBody(updateProjectSchema),
  updateProject
);

/**
 * DELETE /api/projects/:id
 * Delete a project (requires LEAD role or System Admin).
 */
router.delete(
  '/:id',
  validateParams(projectIdParamSchema),
  requireProjectAccess(ProjectRole.LEAD),
  deleteProject
);

/**
 * POST /api/projects/:id/members
 * Add a member to a project (requires MAINTAINER role or higher).
 */
router.post(
  '/:id/members',
  validateParams(projectIdParamSchema),
  requireProjectAccess(ProjectRole.MAINTAINER),
  validateBody(addProjectMemberSchema),
  addProjectMember
);

/**
 * POST /api/projects/:projectId/tasks
 * Create a new task within a project (requires CONTRIBUTOR role or higher).
 */
router.post(
  '/:projectId/tasks',
  validateParams(projectTasksParamSchema),
  requireProjectAccess(ProjectRole.CONTRIBUTOR),
  validateBody(createTaskSchema),
  createTask
);

/**
 * GET /api/projects/:projectId/tasks
 * List tasks belonging to a specific project (requires VIEWER role or higher).
 */
router.get(
  '/:projectId/tasks',
  validateParams(projectTasksParamSchema),
  requireProjectAccess(ProjectRole.VIEWER),
  (req, res) => {
    req.query.projectId = req.params.projectId;
    return listTasks(req, res);
  }
);

/**
 * GET /api/projects/:projectId/activities
 * List activity feed for a project (requires VIEWER role or higher).
 */
router.get(
  '/:projectId/activities',
  validateParams(projectActivitiesParamSchema),
  requireProjectAccess(ProjectRole.VIEWER),
  validateQuery(listActivitiesQuerySchema),
  listProjectActivities
);

/**
 * GET /api/projects/:projectId/analytics
 * Retrieve project metrics and performance analytics (requires VIEWER role or higher).
 */
router.get(
  '/:projectId/analytics',
  validateParams(projectAnalyticsParamSchema),
  requireProjectAccess(ProjectRole.VIEWER),
  getProjectAnalytics
);

export default router;

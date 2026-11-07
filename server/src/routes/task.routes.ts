import { Router } from 'express';
import { ProjectRole } from '@prisma/client';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskAssignee,
  deleteTask
} from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireTaskAccess, requireProjectAccess } from '../middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
  taskIdParamSchema,
  createTaskWithProjectSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTaskAssigneeSchema,
  listTasksQuerySchema
} from '../validators/task.validator';
import { listTaskComments, createComment } from '../controllers/comment.controller';
import { taskCommentsParamSchema, createCommentSchema } from '../validators/comment.validator';
import { listTaskActivities } from '../controllers/activity.controller';
import { taskActivitiesParamSchema, listActivitiesQuerySchema } from '../validators/activity.validator';

const router = Router();

// Enforce authentication on all task endpoints
router.use(requireAuth);

/**
 * GET /api/tasks
 * List accessible tasks with filters and pagination.
 */
router.get(
  '/',
  validateQuery(listTasksQuerySchema),
  listTasks
);

/**
 * POST /api/tasks
 * Create a new task (body contains projectId).
 */
router.post(
  '/',
  validateBody(createTaskWithProjectSchema),
  (req, res, next) => {
    req.params.projectId = req.body.projectId;
    return requireProjectAccess(ProjectRole.CONTRIBUTOR)(req, res, next);
  },
  createTask
);

/**
 * GET /api/tasks/:id
 * Get full task details (requires at least VIEWER role on parent project).
 */
router.get(
  '/:id',
  validateParams(taskIdParamSchema),
  requireTaskAccess(false),
  getTaskById
);

/**
 * PUT /api/tasks/:id
 * Update task details (requires CONTRIBUTOR role or higher).
 */
router.put(
  '/:id',
  validateParams(taskIdParamSchema),
  requireTaskAccess(true),
  validateBody(updateTaskSchema),
  updateTask
);

/**
 * PATCH /api/tasks/:id/status
 * Update task status (requires CONTRIBUTOR role or higher).
 */
router.patch(
  '/:id/status',
  validateParams(taskIdParamSchema),
  requireTaskAccess(true),
  validateBody(updateTaskStatusSchema),
  updateTaskStatus
);

/**
 * PATCH /api/tasks/:id/assignee
 * Assign or reassign a task (requires CONTRIBUTOR role or higher).
 */
router.patch(
  '/:id/assignee',
  validateParams(taskIdParamSchema),
  requireTaskAccess(true),
  validateBody(updateTaskAssigneeSchema),
  updateTaskAssignee
);

/**
 * DELETE /api/tasks/:id
 * Delete a task (requires LEAD, MAINTAINER, System ADMIN, or Task Creator).
 */
router.delete(
  '/:id',
  validateParams(taskIdParamSchema),
  requireTaskAccess(true),
  deleteTask
);

/**
 * GET /api/tasks/:taskId/comments
 * List all comments for a task in chronological order.
 */
router.get(
  '/:taskId/comments',
  validateParams(taskCommentsParamSchema),
  requireTaskAccess(false),
  listTaskComments
);

/**
 * POST /api/tasks/:taskId/comments
 * Create a new comment on a task.
 */
router.post(
  '/:taskId/comments',
  validateParams(taskCommentsParamSchema),
  requireTaskAccess(true),
  validateBody(createCommentSchema),
  createComment
);

/**
 * GET /api/tasks/:taskId/activities
 * List activity history for a specific task (requires VIEWER role or higher on parent project).
 */
router.get(
  '/:taskId/activities',
  validateParams(taskActivitiesParamSchema),
  requireTaskAccess(false),
  validateQuery(listActivitiesQuerySchema),
  listTaskActivities
);

export default router;

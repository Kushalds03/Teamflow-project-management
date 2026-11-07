import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireCommentAccess } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  commentIdParamSchema,
  updateCommentSchema
} from '../validators/comment.validator';

const router = Router();

// Enforce authentication on all comment endpoints
router.use(requireAuth);

/**
 * PUT /api/comments/:id
 * Edit an existing comment.
 */
router.put(
  '/:id',
  validateParams(commentIdParamSchema),
  requireCommentAccess(true),
  validateBody(updateCommentSchema),
  updateComment
);

/**
 * DELETE /api/comments/:id
 * Delete a comment.
 */
router.delete(
  '/:id',
  validateParams(commentIdParamSchema),
  requireCommentAccess(true),
  deleteComment
);

export default router;

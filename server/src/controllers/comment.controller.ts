import { Request, Response } from 'express';
import { ActivityType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { CreateCommentInput, UpdateCommentInput } from '../validators/comment.validator';

const COMMENT_AUTHOR_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  jobTitle: true,
  department: true,
  role: true
};

/**
 * GET /api/tasks/:taskId/comments
 * List all comments for a task in chronological order.
 * - Access is verified by requireTaskAccess(false).
 * - Excludes sensitive user fields (e.g. passwordHash).
 */
export const listTaskComments = async (
  req: Request<{ taskId: string }>,
  res: Response
) => {
  try {
    const { taskId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: COMMENT_AUTHOR_SELECT
        }
      }
    });

    return sendSuccess(res, comments, 200);
  } catch (error) {
    console.error('Error listing task comments:', error);
    return sendError(res, 'Failed to fetch task comments.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * POST /api/tasks/:taskId/comments
 * Create a new comment on a task.
 * - Enforces write access via requireTaskAccess(true).
 * - Binds authorId to authenticated user.
 * - Records ActivityType.COMMENT_ADDED inside transaction.
 */
export const createComment = async (
  req: Request<{ taskId: string }, unknown, CreateCommentInput>,
  res: Response
) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const user = req.user!;
    const task = req.task;

    const createdComment = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          content,
          taskId,
          authorId: user.id
        },
        include: {
          author: {
            select: COMMENT_AUTHOR_SELECT
          }
        }
      });

      await tx.activity.create({
        data: {
          type: ActivityType.COMMENT_ADDED,
          title: 'Comment Added',
          description: `${user.name} commented on "${task.title}".`,
          entityId: comment.id,
          projectId: task.projectId,
          taskId: task.id,
          userId: user.id
        }
      });

      return comment;
    });

    return sendSuccess(res, createdComment, 201);
  } catch (error) {
    console.error('Error creating comment:', error);
    return sendError(res, 'Failed to create comment.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * PUT /api/comments/:id
 * Edit an existing comment.
 * - Enforces access and author/maintainer permissions via requireCommentAccess(true).
 */
export const updateComment = async (
  req: Request<{ id: string }, unknown, UpdateCommentInput>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: COMMENT_AUTHOR_SELECT
        }
      }
    });

    return sendSuccess(res, updatedComment, 200);
  } catch (error) {
    console.error('Error updating comment:', error);
    return sendError(res, 'Failed to update comment.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * DELETE /api/comments/:id
 * Delete a comment.
 * - Enforces access and author/maintainer permissions via requireCommentAccess(true).
 * - Cascades related activities referencing this comment.
 */
export const deleteComment = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // Clean up activities referencing this comment
      await tx.activity.deleteMany({
        where: { entityId: id }
      });

      // Delete the comment
      await tx.comment.delete({
        where: { id }
      });
    });

    return sendSuccess(
      res,
      { message: 'Comment deleted successfully.', commentId: id },
      200
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return sendError(res, 'Failed to delete comment.', 500, 'INTERNAL_SERVER_ERROR');
  }
};

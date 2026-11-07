import { z } from 'zod';

/**
 * Validates task comment URL parameters (:taskId)
 */
export const taskCommentsParamSchema = z.object({
  taskId: z
    .string({ error: 'Task ID is required' })
    .trim()
    .min(1, 'Task ID cannot be empty')
    .max(128, 'Task ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed task ID')
});

/**
 * Validates comment URL parameters (:id)
 */
export const commentIdParamSchema = z.object({
  id: z
    .string({ error: 'Comment ID is required' })
    .trim()
    .min(1, 'Comment ID cannot be empty')
    .max(128, 'Comment ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed comment ID')
});

/**
 * Validates comment creation payload
 */
export const createCommentSchema = z.object({
  content: z
    .string({ error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(5000, 'Comment content cannot exceed 5000 characters')
});

/**
 * Validates comment update payload
 */
export const updateCommentSchema = z.object({
  content: z
    .string({ error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(5000, 'Comment content cannot exceed 5000 characters')
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type TaskCommentsParam = z.infer<typeof taskCommentsParamSchema>;
export type CommentIdParam = z.infer<typeof commentIdParamSchema>;

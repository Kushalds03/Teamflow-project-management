import { z } from 'zod';
import { ActivityType } from '@prisma/client';

/**
 * Validates ActivityType enum values
 */
export const activityTypeSchema = z.nativeEnum(ActivityType, {
  error: 'Invalid activity type. Must be one of: TASK_COMPLETED, PROJECT_CREATED, TASK_CREATED, TASK_STATUS_CHANGED, MEMBER_ASSIGNED, COMMENT_ADDED'
});

/**
 * Helper schema for optional ISO or YYYY-MM-DD date strings
 */
const optionalDateSchema = z
  .string()
  .trim()
  .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
  .transform((val) => (val ? val : undefined))
  .optional();

/**
 * Validates project activities URL parameters (:projectId)
 */
export const projectActivitiesParamSchema = z.object({
  projectId: z
    .string({ error: 'Project ID is required' })
    .trim()
    .min(1, 'Project ID cannot be empty')
    .max(128, 'Project ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed project ID')
});

/**
 * Validates task activities URL parameters (:taskId)
 */
export const taskActivitiesParamSchema = z.object({
  taskId: z
    .string({ error: 'Task ID is required' })
    .trim()
    .min(1, 'Task ID cannot be empty')
    .max(128, 'Task ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed task ID')
});

/**
 * Validates query parameters for listing activities
 */
export const listActivitiesQuerySchema = z
  .object({
    type: activityTypeSchema.optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    from: optionalDateSchema,
    to: optionalDateSchema,
    page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(20)
  })
  .refine(
    (data) => {
      const start = data.startDate || data.from;
      const end = data.endDate || data.to;
      if (start && end) {
        return new Date(start) <= new Date(end);
      }
      return true;
    },
    {
      message: 'startDate cannot be after endDate',
      path: ['startDate']
    }
  );

export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
export type ProjectActivitiesParam = z.infer<typeof projectActivitiesParamSchema>;
export type TaskActivitiesParam = z.infer<typeof taskActivitiesParamSchema>;

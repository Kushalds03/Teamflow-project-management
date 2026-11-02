import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

/**
 * Validates TaskStatus enum values
 */
export const taskStatusSchema = z.nativeEnum(TaskStatus, {
  error: 'Invalid task status. Must be TODO, IN_PROGRESS, IN_REVIEW, or DONE'
});

/**
 * Validates TaskPriority enum values
 */
export const taskPrioritySchema = z.nativeEnum(TaskPriority, {
  error: 'Invalid priority. Must be LOW, MEDIUM, or HIGH'
});

/**
 * Helper schema for optional date strings (ISO or YYYY-MM-DD)
 */
export const optionalDateSchema = z
  .string()
  .trim()
  .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
  .transform((val) => (val ? val : null))
  .optional()
  .nullable();

/**
 * Validates task URL parameter (:id)
 */
export const taskIdParamSchema = z.object({
  id: z
    .string({ error: 'Task ID is required' })
    .trim()
    .min(1, 'Task ID cannot be empty')
    .max(128, 'Task ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed task ID')
});

/**
 * Validates project tasks URL parameter (:projectId)
 */
export const projectTasksParamSchema = z.object({
  projectId: z
    .string({ error: 'Project ID is required' })
    .trim()
    .min(1, 'Project ID cannot be empty')
    .max(128, 'Project ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed project ID')
});

/**
 * Validates task creation payload
 */
export const createTaskSchema = z.object({
  title: z
    .string({ error: 'Task title is required' })
    .trim()
    .min(1, 'Task title cannot be empty')
    .max(200, 'Task title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  status: taskStatusSchema.optional().default(TaskStatus.TODO),
  priority: taskPrioritySchema.optional().default(TaskPriority.MEDIUM),
  dueDate: optionalDateSchema,
  estimatedHours: z
    .number()
    .min(0, 'Estimated hours must be non-negative')
    .max(10000, 'Estimated hours cannot exceed 10000')
    .optional()
    .nullable(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Tag cannot be empty')
        .max(50, 'Tag cannot exceed 50 characters')
    )
    .optional()
    .default([]),
  assigneeId: z
    .string()
    .trim()
    .min(1, 'Assignee ID cannot be empty')
    .max(128, 'Assignee ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed assignee ID')
    .optional()
    .nullable()
});

/**
 * Schema for task creation with projectId in body (optional fallback)
 */
export const createTaskWithProjectSchema = createTaskSchema.extend({
  projectId: z
    .string({ error: 'Project ID is required' })
    .trim()
    .min(1, 'Project ID cannot be empty')
    .max(128, 'Project ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed project ID')
});

/**
 * Validates task update payload
 */
export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Task title cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: optionalDateSchema,
    estimatedHours: z
      .number()
      .min(0, 'Estimated hours must be non-negative')
      .max(10000, 'Estimated hours cannot exceed 10000')
      .optional()
      .nullable(),
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Tag cannot be empty')
          .max(50, 'Tag cannot exceed 50 characters')
      )
      .optional(),
    assigneeId: z
      .string()
      .trim()
      .min(1, 'Assignee ID cannot be empty')
      .max(128, 'Assignee ID cannot exceed 128 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed assignee ID')
      .optional()
      .nullable()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

/**
 * Validates status update payload
 */
export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema
});

/**
 * Validates assignee change payload
 */
export const updateTaskAssigneeSchema = z.object({
  assigneeId: z
    .string({ error: 'Assignee ID is required or must be null' })
    .trim()
    .min(1, 'Assignee ID cannot be empty')
    .max(128, 'Assignee ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed assignee ID')
    .nullable()
});

/**
 * Validates query parameters for listing tasks
 */
export const listTasksQuerySchema = z.object({
  projectId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed project ID')
    .optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed assignee ID')
    .optional(),
  search: z.string().trim().optional(),
  dueDate: optionalDateSchema,
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(20)
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateTaskWithProjectInput = z.infer<typeof createTaskWithProjectSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type UpdateTaskAssigneeInput = z.infer<typeof updateTaskAssigneeSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type ProjectTasksParam = z.infer<typeof projectTasksParamSchema>;

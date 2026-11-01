import { z } from 'zod';
import { ProjectRole, ProjectStatus, TaskPriority } from '@prisma/client';

/**
 * Validates ProjectRole enum values
 */
export const projectRoleSchema = z.nativeEnum(ProjectRole, {
  error: 'Invalid project role. Must be LEAD, MAINTAINER, CONTRIBUTOR, or VIEWER'
});

/**
 * Validates ProjectStatus enum values
 */
export const projectStatusSchema = z.nativeEnum(ProjectStatus, {
  error: 'Invalid project status. Must be PLANNING, IN_PROGRESS, ON_HOLD, or COMPLETED'
});

/**
 * Validates TaskPriority enum values
 */
export const projectPrioritySchema = z.nativeEnum(TaskPriority, {
  error: 'Invalid priority. Must be LOW, MEDIUM, or HIGH'
});

/**
 * Helper schema for optional date strings (ISO or YYYY-MM-DD)
 */
const optionalDateSchema = z
  .string()
  .trim()
  .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
  .transform((val) => (val ? val : null))
  .optional()
  .nullable();

/**
 * Validates project URL parameters (:id)
 */
export const projectIdParamSchema = z.object({
  id: z
    .string({ error: 'Project ID is required' })
    .trim()
    .min(1, 'Project ID cannot be empty')
    .max(128, 'Project ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed project ID')
});

/**
 * Validates project creation payload
 */
export const createProjectSchema = z.object({
  name: z
    .string({ error: 'Project name is required' })
    .trim()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  category: z
    .string()
    .trim()
    .min(1, 'Category cannot be empty')
    .max(50, 'Category cannot exceed 50 characters')
    .optional()
    .default('General'),
  status: projectStatusSchema.optional().default(ProjectStatus.IN_PROGRESS),
  priority: projectPrioritySchema.optional().default(TaskPriority.MEDIUM),
  dueDate: optionalDateSchema,
  startDate: optionalDateSchema,
  workspaceId: z
    .string({ error: 'Workspace ID is required' })
    .trim()
    .min(1, 'Workspace ID cannot be empty')
    .max(128, 'Workspace ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed workspace ID'),
  leadId: z
    .string()
    .trim()
    .min(1, 'Lead ID cannot be empty')
    .max(128, 'Lead ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed lead ID')
    .optional()
});

/**
 * Validates project update payload
 */
export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(100, 'Project name cannot exceed 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .nullable(),
    category: z
      .string()
      .trim()
      .min(1, 'Category cannot be empty')
      .max(50, 'Category cannot exceed 50 characters')
      .optional(),
    status: projectStatusSchema.optional(),
    priority: projectPrioritySchema.optional(),
    dueDate: optionalDateSchema,
    startDate: optionalDateSchema,
    workspaceId: z
      .string()
      .trim()
      .min(1, 'Workspace ID cannot be empty')
      .max(128, 'Workspace ID cannot exceed 128 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed workspace ID')
      .optional(),
    leadId: z
      .string()
      .trim()
      .min(1, 'Lead ID cannot be empty')
      .max(128, 'Lead ID cannot exceed 128 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed lead ID')
      .optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

/**
 * Validates adding a member to a project
 */
export const addProjectMemberSchema = z.object({
  userId: z
    .string({ error: 'User ID is required' })
    .trim()
    .min(1, 'User ID cannot be empty')
    .max(128, 'User ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed user ID'),
  role: projectRoleSchema.optional().default(ProjectRole.CONTRIBUTOR)
});

/**
 * Validates query parameters for listing projects
 */
export const listProjectsQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).optional(),
  status: projectStatusSchema.optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

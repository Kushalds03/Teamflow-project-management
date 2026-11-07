import { z } from 'zod';

/**
 * Validates project analytics URL parameter (:projectId)
 */
export const projectAnalyticsParamSchema = z.object({
  projectId: z
    .string({ error: 'Project ID is required' })
    .trim()
    .min(1, 'Project ID cannot be empty')
    .max(128, 'Project ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed project ID')
});

/**
 * Validates workspace analytics URL parameter (:workspaceId)
 */
export const workspaceAnalyticsParamSchema = z.object({
  workspaceId: z
    .string({ error: 'Workspace ID is required' })
    .trim()
    .min(1, 'Workspace ID cannot be empty')
    .max(128, 'Workspace ID cannot exceed 128 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Malformed workspace ID')
});

export type ProjectAnalyticsParam = z.infer<typeof projectAnalyticsParamSchema>;
export type WorkspaceAnalyticsParam = z.infer<typeof workspaceAnalyticsParamSchema>;


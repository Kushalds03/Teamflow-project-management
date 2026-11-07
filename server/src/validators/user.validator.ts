import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
  jobTitle: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').or(z.literal('')).optional().nullable(),
  status: z.enum(['active', 'away', 'offline']).optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;


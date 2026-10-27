import { z } from 'zod';

export const updateProfileInputSchema = z.object({
  displayName: z.string().min(1).max(100).trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  currency: z.string().min(1).max(10).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

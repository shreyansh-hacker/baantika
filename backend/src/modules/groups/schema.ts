import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name must be at most 100 characters').trim(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('INR'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name must be at most 100 characters').trim().optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const addMemberSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const createInvitationSchema = z.object({
  inviteEmail: z.string().email('Valid email address is required').toLowerCase().trim().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

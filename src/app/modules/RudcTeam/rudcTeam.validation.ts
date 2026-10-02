import { z } from 'zod';

const rudcTeamZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
  }),
});

const assignTeamMembersZodSchema = z.object({
  body: z.object({
    teamId: z.number(),
    userIds: z.array(z.number()).min(1, 'At least one user must be selected'),
    role: z.string().optional().default('MEMBER'),
  }),
});

export const RudcTeamValidation = {
  rudcTeamZodSchema,
  assignTeamMembersZodSchema,
};

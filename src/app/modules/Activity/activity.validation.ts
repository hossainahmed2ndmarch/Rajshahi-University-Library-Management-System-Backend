import { z } from 'zod';
import { ActivityStatus, Organization } from '@prisma/client';

const createActivityValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional().default(Organization.RUIL),
    title: z.string().min(1, 'Title is required'),
    category: z.string().optional(),
    description: z.string().optional(),
    bannerImage: z.string().url().nullable().optional(),
    status: z.nativeEnum(ActivityStatus).optional().default(ActivityStatus.ONGOING),
  }),
});

const updateActivityValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional(),
    title: z.string().min(1).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    bannerImage: z.string().url().nullable().optional(),
    status: z.nativeEnum(ActivityStatus).optional(),
  }),
});

export const ActivityValidation = {
  createActivityValidationSchema,
  updateActivityValidationSchema,
};

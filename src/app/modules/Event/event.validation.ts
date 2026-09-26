import { z } from 'zod';
import { EventStatus, Organization } from '@prisma/client';

const createEventValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional().default(Organization.RUIL),
    activityId: z.number().int().positive().nullable().optional(),
    title: z.string().min(1, 'Title is required'),
    category: z.string().optional(),
    status: z.nativeEnum(EventStatus).optional().default(EventStatus.UPCOMING),
    scheduleText: z.string().optional(),
    location: z.string().optional(),
    bannerImage: z.string().url().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    currentChapter: z.string().optional(),
    bookIds: z.array(z.number().int().positive()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

const updateEventValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional(),
    activityId: z.number().int().positive().nullable().optional(),
    title: z.string().min(1).optional(),
    category: z.string().optional(),
    status: z.nativeEnum(EventStatus).optional(),
    scheduleText: z.string().optional(),
    location: z.string().optional(),
    bannerImage: z.string().url().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    currentChapter: z.string().optional(),
    bookIds: z.array(z.number().int().positive()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const EventValidation = {
  createEventValidationSchema,
  updateEventValidationSchema,
};

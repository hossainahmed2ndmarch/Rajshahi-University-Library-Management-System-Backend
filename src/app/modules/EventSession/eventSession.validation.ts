import { z } from 'zod';

const createEventSessionValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive('Valid eventId is required'),
    sessionDate: z.string().min(1, 'Session date is required'),
    chapter: z.string().optional(),
    summary: z.string().optional(),
    audioUrl: z.string().url().nullable().optional(),
  }),
});

const updateEventSessionValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive().optional(),
    sessionDate: z.string().optional(),
    chapter: z.string().optional(),
    summary: z.string().optional(),
    audioUrl: z.string().url().nullable().optional(),
  }),
});

export const EventSessionValidation = {
  createEventSessionValidationSchema,
  updateEventSessionValidationSchema,
};

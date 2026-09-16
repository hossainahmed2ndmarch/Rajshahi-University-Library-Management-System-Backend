import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createScheduleSchema = z.object({
  body: z.object({
    shifterId: z.number(),
    dayOfWeek: z
      .number()
      .min(0, 'Day of week must be 0-6')
      .max(6, 'Day of week must be 0-6'),
    dayName: z.string().min(1, 'Bengali day name is required'),
    dayEn: z.string().min(1, 'English day name is required'),
    slot: z.string().min(1, 'Slot identifier is required'),
    slotName: z.string().min(1, 'Slot display name is required'),
    startTime: z
      .string()
      .regex(timeRegex, 'Start time must be in HH:MM format (e.g. 15:30)'),
    endTime: z
      .string()
      .regex(timeRegex, 'End time must be in HH:MM format (e.g. 18:15)'),
    isActive: z.boolean().optional().default(true),
    notes: z.string().optional(),
  }),
});

const updateScheduleSchema = z.object({
  body: z.object({
    shifterId: z.number().optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayName: z.string().optional(),
    dayEn: z.string().optional(),
    slot: z.string().optional(),
    slotName: z.string().optional(),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format').optional(),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format').optional(),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

export const ShifterScheduleValidation = {
  createScheduleSchema,
  updateScheduleSchema,
};

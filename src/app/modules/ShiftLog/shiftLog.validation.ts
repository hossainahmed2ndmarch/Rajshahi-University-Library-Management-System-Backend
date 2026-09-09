import { z } from 'zod';

const checkInValidationSchema = z.object({
  body: z.object({
    openingCash: z
      .number()
      .min(0, 'Opening cash float cannot be negative'),
    notes: z.string().optional(),
  }),
});

const checkOutValidationSchema = z.object({
  body: z.object({
    closingCash: z
      .number()
      .min(0, 'Closing cash cannot be negative'),
    cashCollected: z.number().min(0, 'Cash collected cannot be negative').optional(),
    tasksCompleted: z.string().optional(),
    handoverNotes: z.string().optional(),
  }),
});

const scheduleShiftValidationSchema = z.object({
  body: z.object({
    startTime: z.string().min(1, 'Shift start time is required'),
    endTime: z.string().optional(),
    shiftSlotName: z.string().optional(),
    openingCash: z.number().min(0).optional().default(500),
    notes: z.string().optional(),
    notifyRecipients: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]).optional(),
    notificationMethod: z.enum(['EMAIL', 'SMS', 'SOCIAL_MEDIA', 'ALL']).optional().default('EMAIL'),
  }),
});

const cancelShiftValidationSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(3, 'Please provide a descriptive reason for cancelling shift'),
    notifyRecipients: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]).optional(),
    notificationMethod: z.enum(['EMAIL', 'SMS', 'SOCIAL_MEDIA', 'ALL']).optional().default('EMAIL'),
  }),
});

export const ShiftLogValidation = {
  checkInValidationSchema,
  checkOutValidationSchema,
  scheduleShiftValidationSchema,
  cancelShiftValidationSchema,
};

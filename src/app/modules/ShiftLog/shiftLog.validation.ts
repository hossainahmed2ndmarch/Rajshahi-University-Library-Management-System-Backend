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

const rescheduleShiftValidationSchema = z.object({
  body: z.object({
    newStartTime: z.string().min(1, 'New start time is required'),
    newEndTime: z.string().optional(),
    reason: z.string().optional(),
    notifyRecipients: z
      .union([z.string(), z.array(z.union([z.string(), z.number()]))])
      .optional(),
    notificationMethod: z
      .enum(['EMAIL', 'SMS', 'SOCIAL_MEDIA', 'ALL'])
      .optional()
      .default('EMAIL'),
  }),
});

const completeOfflineShiftValidationSchema = z.object({
  body: z.object({
    openingCash: z.number().min(0, 'Opening cash cannot be negative'),
    closingCash: z.number().min(0, 'Closing cash cannot be negative'),
    cashCollected: z.number().min(0, 'Cash collected cannot be negative'),
    tasksCompleted: z.string().optional(),
    handoverNotes: z.string().optional(),
    isOfflineRecord: z.boolean().optional().default(true),
  }),
});

const emailActionValidationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Action token is required'),
    action: z.enum(['START', 'CANCEL']),
    cancelReason: z.string().optional(),
    openingCash: z.number().min(0).optional().default(0),
  }),
});

export const ShiftLogValidation = {
  checkInValidationSchema,
  checkOutValidationSchema,
  scheduleShiftValidationSchema,
  cancelShiftValidationSchema,
  rescheduleShiftValidationSchema,
  completeOfflineShiftValidationSchema,
  emailActionValidationSchema,
};

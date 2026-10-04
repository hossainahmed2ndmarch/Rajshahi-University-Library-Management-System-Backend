import { z } from 'zod';
import { IyanotPaymentMethod, IyanotStatus } from '@prisma/client';

const recordIyanotZodSchema = z.object({
  body: z.object({
    userId: z.number(),
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2050),
    amount: z.number().min(1).default(50),
    paymentMethod: z.nativeEnum(IyanotPaymentMethod),
    collectedById: z.number().optional(),
    transactionId: z.string().optional(),
    remarks: z.string().optional(),
  }),
});

const updateIyanotStatusZodSchema = z.object({
  body: z.object({
    status: z.nativeEnum(IyanotStatus),
    remarks: z.string().optional(),
    collectedById: z.number().optional(),
  }),
});

export const RudcIyanotValidation = {
  recordIyanotZodSchema,
  updateIyanotStatusZodSchema,
};

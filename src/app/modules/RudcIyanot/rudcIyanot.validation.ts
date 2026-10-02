import { z } from 'zod';
import { IyanotPaymentMethod } from '@prisma/client';

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

export const RudcIyanotValidation = {
  recordIyanotZodSchema,
};

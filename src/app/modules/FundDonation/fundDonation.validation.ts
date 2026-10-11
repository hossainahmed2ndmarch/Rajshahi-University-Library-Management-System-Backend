import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

const initiateDonationValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive().nullable().optional(),
    amount: z.number().positive('Donation amount must be greater than 0'),
    donorName: z.string().optional(),
    donorEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    donorPhone: z.string().optional(),
    isAnonymous: z.boolean().optional().default(false),
    donorNote: z.string().optional(),
  }),
});

const createManualDonationValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive().nullable().optional(),
    userId: z.number().int().positive().nullable().optional(),
    amount: z.number().positive('Amount must be positive'),
    donorName: z.string().optional(),
    donorEmail: z.string().email().optional().or(z.literal('')),
    donorPhone: z.string().optional(),
    isAnonymous: z.boolean().optional().default(false),
    donorNote: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    paymentStatus: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.PAID),
    receiptNo: z.string().optional(),
    paidAt: z.string().optional(),
  }),
});

const updateDonationValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive().nullable().optional(),
    amount: z.number().positive().optional(),
    donorName: z.string().optional(),
    donorEmail: z.string().email().optional().or(z.literal('')),
    donorPhone: z.string().optional(),
    isAnonymous: z.boolean().optional(),
    donorNote: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    receiptNo: z.string().optional(),
  }),
});

export const FundDonationValidation = {
  initiateDonationValidationSchema,
  createManualDonationValidationSchema,
  updateDonationValidationSchema,
};

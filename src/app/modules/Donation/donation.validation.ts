import { z } from 'zod';
import { DonationMethod } from '@prisma/client';

const createDonationValidationSchema = z.object({
  body: z.object({
    donorName: z.string().optional(),
    donorEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    donorPhone: z.string().optional().or(z.literal('')),
    method: z.nativeEnum(DonationMethod).optional(),
    isAnonymous: z.boolean().optional(),
    donorNote: z.string().optional(),
    notes: z.string().optional(),
    condition: z.string().optional(),
    bookTitle: z.string().min(1, 'Book title is required'),
    author: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive').optional().default(1),
    pickupAddress: z.string().optional(),
    scheduledAt: z.string().optional().or(z.date()).optional(),
  }),
});

const approveDonationValidationSchema = z.object({
  body: z.object({
    locationCell: z.string().optional(),
    assignedCategory: z.string().optional(),
    pages: z.number().int().positive().optional(),
    isbn: z.string().optional(),
    borrowStock: z.number().int().min(0).optional(),
    sellStock: z.number().int().min(0).optional(),
  }).optional(),
});

const convertDonationValidationSchema = z.object({
  body: z.object({
    isbn: z.string().min(1, 'ISBN is required'),
    locationCell: z.string().min(1, 'Location cell is required'),
    pages: z.number().int('Pages must be an integer').positive('Pages must be a positive integer'),
    type: z.enum(['BORROW_ONLY', 'SELL_ONLY', 'HYBRID']),
    sellPrice: z.number().positive('Sell price must be positive').optional(),
    borrowStock: z.number().int('Borrow stock must be an integer').min(0).optional(),
    sellStock: z.number().int('Sell stock must be an integer').min(0).optional(),
    coverImage: z.string().optional(),
    description: z.string().optional(),
  }),
});

const posDonationValidationSchema = z.object({
  body: z.object({
    donorType: z.enum(['MEMBER', 'GUEST']).optional().default('GUEST'),
    memberId: z.number().int().positive().optional(),
    donorName: z.string().optional(),
    donorEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    isAnonymous: z.boolean().optional(),
    donorNote: z.string().optional(),
    condition: z.string().optional(),
    bookTitle: z.string().min(1, 'Book title is required'),
    author: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive').optional().default(1),
    autoCatalog: z.boolean().optional().default(true),
    locationCell: z.string().optional(),
    isbn: z.string().optional(),
    pages: z.number().int().positive().optional(),
  }),
});

export const DonationValidation = {
  createDonationValidationSchema,
  approveDonationValidationSchema,
  convertDonationValidationSchema,
  posDonationValidationSchema,
};

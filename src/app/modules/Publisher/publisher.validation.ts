import { z } from 'zod';

const createPublisherValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Publisher name is required'),
    logo: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    websiteUrl: z.string().nullable().optional(),
    defaultDiscount: z.number().min(0, 'Discount must be positive').max(100, 'Discount cannot exceed 100').optional().default(0),
  }),
});

const updatePublisherValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    logo: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    websiteUrl: z.string().nullable().optional(),
    defaultDiscount: z.number().min(0).max(100).optional(),
  }),
});

export const PublisherValidation = {
  createPublisherValidationSchema,
  updatePublisherValidationSchema,
};

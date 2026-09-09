import { z } from 'zod';

const createBookReviewValidationSchema = z.object({
  body: z.object({
    bookId: z.number().int('Book ID must be an integer').positive('Book ID must be a positive integer'),
    rating: z.number().int('Rating must be an integer').min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().optional(),
    reviewerName: z.string().optional(),
    reviewerEmail: z.string().email('Invalid email address').optional(),
    isAnonymous: z.boolean().optional(),
  }),
});

const createServiceReviewValidationSchema = z.object({
  body: z.object({
    rating: z.number().int('Rating must be an integer').min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().optional(),
    isAnonymous: z.boolean().optional(),
    reviewerName: z.string().optional(),
    reviewerEmail: z.string().email('Invalid email address').optional(),
  }),
});

export const ReviewValidation = {
  createBookReviewValidationSchema,
  createServiceReviewValidationSchema,
};

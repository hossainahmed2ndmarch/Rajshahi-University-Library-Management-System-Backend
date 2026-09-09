import { z } from 'zod';
import { BookType } from '@prisma/client';

const createBookValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    author: z.string().min(1, 'Author is required'),
    isbn: z.string().min(1, 'ISBN is required'),
    locationCell: z.string().min(1, 'Location cell is required'),
    category: z.string().min(1, 'Category is required'),
    publisher: z.string().nullable().optional(),
    pages: z.number().int('Pages must be an integer').min(0, 'Pages must be non-negative').optional(),
    type: z.nativeEnum(BookType),
    buyPrice: z.number().min(0, 'Buy price must be non-negative').nullable().optional(),
    sellPrice: z.number().min(0, 'Sell price must be non-negative').nullable().optional(),
    discount: z.number().min(0).max(100).optional().default(0),
    borrowStock: z.number().int('Borrow stock must be an integer').min(0, 'Borrow stock cannot be negative').optional().default(0),
    sellStock: z.number().int('Sell stock must be an integer').min(0, 'Sell stock cannot be negative').optional().default(0),
    coverImage: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    description: z.string().nullable().optional(),
    donatedById: z.number().int().positive().nullable().optional(),
  }),
});

const updateBookValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    isbn: z.string().min(1).optional(),
    locationCell: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    publisher: z.string().nullable().optional(),
    pages: z.number().int().min(0).optional(),
    type: z.nativeEnum(BookType).optional(),
    buyPrice: z.number().min(0).nullable().optional(),
    sellPrice: z.number().min(0).nullable().optional(),
    discount: z.number().min(0).max(100).optional(),
    borrowStock: z.number().int().min(0).optional(),
    sellStock: z.number().int().min(0).optional(),
    coverImage: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    description: z.string().nullable().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const BookValidation = {
  createBookValidationSchema,
  updateBookValidationSchema,
};

import { z } from 'zod';
import { Organization } from '@prisma/client';

const createArticleValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional(),
    title: z.string().min(1, 'Title is required'),
    slug: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
    coverImage: z.string().nullable().optional(),
    category: z.string().min(1, 'Category is required'),
    authorUserId: z.number().int().positive().nullable().optional(),
    authorName: z.string().min(1, 'Author name is required'),
    authorDesignation: z.string().nullable().optional(),
    relatedBookId: z.number().int().positive().nullable().optional(),
    totalReadTime: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional().default(false),
  }),
});

const submitArticleValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional().default(Organization.RUIL),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().min(1, 'Category is required'),
    authorName: z.string().min(1, 'Author name is required'),
    authorDesignation: z.string().nullable().optional(),
    authorEmail: z.string().email('Invalid email').nullable().optional(),
    coverImage: z.string().nullable().optional(),
  }),
});

const updateArticleValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional(),
    title: z.string().min(1).optional(),
    slug: z.string().optional(),
    content: z.string().min(1).optional(),
    coverImage: z.string().nullable().optional(),
    category: z.string().min(1).optional(),
    authorUserId: z.number().int().positive().nullable().optional(),
    authorName: z.string().min(1).optional(),
    authorDesignation: z.string().nullable().optional(),
    relatedBookId: z.number().int().positive().nullable().optional(),
    totalReadTime: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const ArticleValidation = {
  createArticleValidationSchema,
  submitArticleValidationSchema,
  updateArticleValidationSchema,
};

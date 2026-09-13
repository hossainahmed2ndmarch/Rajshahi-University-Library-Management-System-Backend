import { z } from 'zod';

const createArticleValidationSchema = z.object({
  body: z.object({
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

const updateArticleValidationSchema = z.object({
  body: z.object({
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
  updateArticleValidationSchema,
};

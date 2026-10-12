import { z } from 'zod';

const createAuthorValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Author name is required'),
    avatar: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    authorDesignation: z.string().nullable().optional(),
    socialLinks: z.record(z.string(), z.string()).nullable().optional(),
    userId: z.number().int().positive().nullable().optional(),
  }),
});

const updateAuthorValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    avatar: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    authorDesignation: z.string().nullable().optional(),
    socialLinks: z.record(z.string(), z.string()).nullable().optional(),
    userId: z.number().int().positive().nullable().optional(),
  }),
});

export const AuthorValidation = {
  createAuthorValidationSchema,
  updateAuthorValidationSchema,
};

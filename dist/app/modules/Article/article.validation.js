"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createArticleValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
        title: zod_1.z.string().min(1, 'Title is required'),
        slug: zod_1.z.string().optional(),
        content: zod_1.z.string().min(1, 'Content is required'),
        coverImage: zod_1.z.string().nullable().optional(),
        category: zod_1.z.string().min(1, 'Category is required'),
        authorUserId: zod_1.z.number().int().positive().nullable().optional(),
        authorName: zod_1.z.string().min(1, 'Author name is required'),
        authorDesignation: zod_1.z.string().nullable().optional(),
        relatedBookId: zod_1.z.number().int().positive().nullable().optional(),
        totalReadTime: zod_1.z.number().int().min(0).optional(),
        isPublished: zod_1.z.boolean().optional().default(false),
    }),
});
const submitArticleValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional().default(client_1.Organization.RUIL),
        title: zod_1.z.string().min(1, 'Title is required'),
        content: zod_1.z.string().min(1, 'Content is required'),
        category: zod_1.z.string().min(1, 'Category is required'),
        authorName: zod_1.z.string().min(1, 'Author name is required'),
        authorDesignation: zod_1.z.string().nullable().optional(),
        authorEmail: zod_1.z.string().email('Invalid email').nullable().optional(),
        coverImage: zod_1.z.string().nullable().optional(),
    }),
});
const updateArticleValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
        title: zod_1.z.string().min(1).optional(),
        slug: zod_1.z.string().optional(),
        content: zod_1.z.string().min(1).optional(),
        coverImage: zod_1.z.string().nullable().optional(),
        category: zod_1.z.string().min(1).optional(),
        authorUserId: zod_1.z.number().int().positive().nullable().optional(),
        authorName: zod_1.z.string().min(1).optional(),
        authorDesignation: zod_1.z.string().nullable().optional(),
        relatedBookId: zod_1.z.number().int().positive().nullable().optional(),
        totalReadTime: zod_1.z.number().int().min(0).optional(),
        isPublished: zod_1.z.boolean().optional(),
    }),
});
exports.ArticleValidation = {
    createArticleValidationSchema,
    submitArticleValidationSchema,
    updateArticleValidationSchema,
};

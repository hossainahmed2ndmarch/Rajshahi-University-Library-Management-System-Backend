"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleValidation = void 0;
const zod_1 = require("zod");
const createArticleValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
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
const updateArticleValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
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
    updateArticleValidationSchema,
};

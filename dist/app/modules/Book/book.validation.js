"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createBookValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        author: zod_1.z.string().min(1, 'Author is required'),
        isbn: zod_1.z.string().min(1, 'ISBN is required'),
        locationCell: zod_1.z.string().min(1, 'Location cell is required'),
        category: zod_1.z.string().min(1, 'Category is required'),
        publisher: zod_1.z.string().nullable().optional(),
        pages: zod_1.z.number().int('Pages must be an integer').min(0, 'Pages must be non-negative').optional(),
        type: zod_1.z.nativeEnum(client_1.BookType),
        buyPrice: zod_1.z.number().min(0, 'Buy price must be non-negative').nullable().optional(),
        sellPrice: zod_1.z.number().min(0, 'Sell price must be non-negative').nullable().optional(),
        discount: zod_1.z.number().min(0).max(100).optional().default(0),
        borrowStock: zod_1.z.number().int('Borrow stock must be an integer').min(0, 'Borrow stock cannot be negative').optional().default(0),
        sellStock: zod_1.z.number().int('Sell stock must be an integer').min(0, 'Sell stock cannot be negative').optional().default(0),
        coverImage: zod_1.z.string().nullable().optional(),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        description: zod_1.z.string().nullable().optional(),
        donatedById: zod_1.z.number().int().positive().nullable().optional(),
    }),
});
const updateBookValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        author: zod_1.z.string().min(1).optional(),
        isbn: zod_1.z.string().min(1).optional(),
        locationCell: zod_1.z.string().min(1).optional(),
        category: zod_1.z.string().min(1).optional(),
        publisher: zod_1.z.string().nullable().optional(),
        pages: zod_1.z.number().int().min(0).optional(),
        type: zod_1.z.nativeEnum(client_1.BookType).optional(),
        buyPrice: zod_1.z.number().min(0).nullable().optional(),
        sellPrice: zod_1.z.number().min(0).nullable().optional(),
        discount: zod_1.z.number().min(0).max(100).optional(),
        borrowStock: zod_1.z.number().int().min(0).optional(),
        sellStock: zod_1.z.number().int().min(0).optional(),
        coverImage: zod_1.z.string().nullable().optional(),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        description: zod_1.z.string().nullable().optional(),
        isArchived: zod_1.z.boolean().optional(),
    }),
});
exports.BookValidation = {
    createBookValidationSchema,
    updateBookValidationSchema,
};

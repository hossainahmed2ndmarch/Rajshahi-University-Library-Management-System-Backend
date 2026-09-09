"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        donorName: zod_1.z.string().optional(),
        donorEmail: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
        contactPhone: zod_1.z.string().optional().or(zod_1.z.literal('')),
        donorPhone: zod_1.z.string().optional().or(zod_1.z.literal('')),
        method: zod_1.z.nativeEnum(client_1.DonationMethod).optional(),
        isAnonymous: zod_1.z.boolean().optional(),
        donorNote: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        condition: zod_1.z.string().optional(),
        bookTitle: zod_1.z.string().min(1, 'Book title is required'),
        author: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive').optional().default(1),
        pickupAddress: zod_1.z.string().optional(),
        scheduledAt: zod_1.z.string().optional().or(zod_1.z.date()).optional(),
    }),
});
const approveDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        locationCell: zod_1.z.string().optional(),
        assignedCategory: zod_1.z.string().optional(),
        pages: zod_1.z.number().int().positive().optional(),
        isbn: zod_1.z.string().optional(),
        borrowStock: zod_1.z.number().int().min(0).optional(),
        sellStock: zod_1.z.number().int().min(0).optional(),
    }).optional(),
});
const convertDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        isbn: zod_1.z.string().min(1, 'ISBN is required'),
        locationCell: zod_1.z.string().min(1, 'Location cell is required'),
        pages: zod_1.z.number().int('Pages must be an integer').positive('Pages must be a positive integer'),
        type: zod_1.z.enum(['BORROW_ONLY', 'SELL_ONLY', 'HYBRID']),
        sellPrice: zod_1.z.number().positive('Sell price must be positive').optional(),
        borrowStock: zod_1.z.number().int('Borrow stock must be an integer').min(0).optional(),
        sellStock: zod_1.z.number().int('Sell stock must be an integer').min(0).optional(),
        coverImage: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
    }),
});
const posDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        donorType: zod_1.z.enum(['MEMBER', 'GUEST']).optional().default('GUEST'),
        memberId: zod_1.z.number().int().positive().optional(),
        donorName: zod_1.z.string().optional(),
        donorEmail: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
        contactPhone: zod_1.z.string().optional().or(zod_1.z.literal('')),
        isAnonymous: zod_1.z.boolean().optional(),
        donorNote: zod_1.z.string().optional(),
        condition: zod_1.z.string().optional(),
        bookTitle: zod_1.z.string().min(1, 'Book title is required'),
        author: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive').optional().default(1),
        autoCatalog: zod_1.z.boolean().optional().default(true),
        locationCell: zod_1.z.string().optional(),
        isbn: zod_1.z.string().optional(),
        pages: zod_1.z.number().int().positive().optional(),
    }),
});
exports.DonationValidation = {
    createDonationValidationSchema,
    approveDonationValidationSchema,
    convertDonationValidationSchema,
    posDonationValidationSchema,
};

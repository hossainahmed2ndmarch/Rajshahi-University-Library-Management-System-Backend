"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherValidation = void 0;
const zod_1 = require("zod");
const createPublisherValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Publisher name is required'),
        logo: zod_1.z.string().nullable().optional(),
        description: zod_1.z.string().nullable().optional(),
        websiteUrl: zod_1.z.string().nullable().optional(),
        defaultDiscount: zod_1.z.number().min(0, 'Discount must be positive').max(100, 'Discount cannot exceed 100').optional().default(0),
    }),
});
const updatePublisherValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        logo: zod_1.z.string().nullable().optional(),
        description: zod_1.z.string().nullable().optional(),
        websiteUrl: zod_1.z.string().nullable().optional(),
        defaultDiscount: zod_1.z.number().min(0).max(100).optional(),
    }),
});
exports.PublisherValidation = {
    createPublisherValidationSchema,
    updatePublisherValidationSchema,
};

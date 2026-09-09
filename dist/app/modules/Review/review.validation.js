"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewValidation = void 0;
const zod_1 = require("zod");
const createBookReviewValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookId: zod_1.z.number().int('Book ID must be an integer').positive('Book ID must be a positive integer'),
        rating: zod_1.z.number().int('Rating must be an integer').min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
        comment: zod_1.z.string().optional(),
        reviewerName: zod_1.z.string().optional(),
        reviewerEmail: zod_1.z.string().email('Invalid email address').optional(),
        isAnonymous: zod_1.z.boolean().optional(),
    }),
});
const createServiceReviewValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number().int('Rating must be an integer').min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
        comment: zod_1.z.string().optional(),
        isAnonymous: zod_1.z.boolean().optional(),
        reviewerName: zod_1.z.string().optional(),
        reviewerEmail: zod_1.z.string().email('Invalid email address').optional(),
    }),
});
exports.ReviewValidation = {
    createBookReviewValidationSchema,
    createServiceReviewValidationSchema,
};

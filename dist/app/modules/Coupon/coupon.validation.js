"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createCouponValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z
            .string()
            .min(2, 'Code must be at least 2 characters')
            .max(30, 'Code too long')
            .transform((val) => val.trim().toUpperCase()),
        description: zod_1.z.string().optional(),
        discountType: zod_1.z.nativeEnum(client_1.CouponDiscountType).default(client_1.CouponDiscountType.PERCENTAGE),
        discountValue: zod_1.z
            .number()
            .positive('Discount value must be greater than zero'),
        minOrderAmount: zod_1.z.number().min(0).optional(),
        maxDiscount: zod_1.z.number().positive().optional(),
        usageLimit: zod_1.z.number().int().positive().optional(),
        perUserLimit: zod_1.z.number().int().positive().default(1),
        isActive: zod_1.z.boolean().default(true),
        expiresAt: zod_1.z.string().optional(),
    }),
});
const updateCouponValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2).max(30).transform((val) => val.trim().toUpperCase()).optional(),
        description: zod_1.z.string().optional(),
        discountType: zod_1.z.nativeEnum(client_1.CouponDiscountType).optional(),
        discountValue: zod_1.z.number().positive().optional(),
        minOrderAmount: zod_1.z.number().min(0).optional(),
        maxDiscount: zod_1.z.number().positive().optional(),
        usageLimit: zod_1.z.number().int().positive().optional(),
        perUserLimit: zod_1.z.number().int().positive().optional(),
        isActive: zod_1.z.boolean().optional(),
        expiresAt: zod_1.z.string().optional().nullable(),
    }),
});
const validateCouponValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Coupon code is required').trim(),
        cartTotal: zod_1.z.number().min(0, 'Cart total is required'),
        userId: zod_1.z.number().optional(),
    }),
});
exports.CouponValidation = {
    createCouponValidationSchema,
    updateCouponValidationSchema,
    validateCouponValidationSchema,
};

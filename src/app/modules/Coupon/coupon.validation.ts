import { z } from 'zod';
import { CouponDiscountType } from '@prisma/client';

const createCouponValidationSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2, 'Code must be at least 2 characters')
      .max(30, 'Code too long')
      .transform((val) => val.trim().toUpperCase()),
    description: z.string().optional(),
    discountType: z.nativeEnum(CouponDiscountType).default(CouponDiscountType.PERCENTAGE),
    discountValue: z
      .number()
      .positive('Discount value must be greater than zero'),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().default(1),
    isActive: z.boolean().default(true),
    expiresAt: z.string().optional(),
  }),
});

const updateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(30).transform((val) => val.trim().toUpperCase()).optional(),
    description: z.string().optional(),
    discountType: z.nativeEnum(CouponDiscountType).optional(),
    discountValue: z.number().positive().optional(),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().optional().nullable(),
  }),
});

const validateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').trim(),
    cartTotal: z.number().min(0, 'Cart total is required'),
    userId: z.number().optional(),
  }),
});

export const CouponValidation = {
  createCouponValidationSchema,
  updateCouponValidationSchema,
  validateCouponValidationSchema,
};

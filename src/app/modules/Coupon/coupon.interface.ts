import { CouponDiscountType } from '@prisma/client';

export type TCreateCouponPayload = {
  code: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
  expiresAt?: string | Date;
};

export type TUpdateCouponPayload = Partial<TCreateCouponPayload>;

export type TValidateCouponPayload = {
  code: string;
  cartTotal: number;
  userId?: number;
};

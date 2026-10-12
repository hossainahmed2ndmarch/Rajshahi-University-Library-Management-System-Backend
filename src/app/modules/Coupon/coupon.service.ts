import httpStatus from 'http-status';
import { CouponDiscountType } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import {
  TCreateCouponPayload,
  TUpdateCouponPayload,
  TValidateCouponPayload,
} from './coupon.interface';

const createCouponInDB = async (payload: TCreateCouponPayload) => {
  const normalizedCode = payload.code.trim().toUpperCase();

  const existing = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, `Coupon with code "${normalizedCode}" already exists!`);
  }

  const result = await prisma.coupon.create({
    data: {
      ...payload,
      code: normalizedCode,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    },
  });

  return result;
};

const getAllCouponsFromDB = async () => {
  const result = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return result;
};

const getCouponByIdFromDB = async (id: number) => {
  const result = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
  }

  return result;
};

const updateCouponInDB = async (id: number, payload: TUpdateCouponPayload) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
  }

  const updateData: Record<string, unknown> = { ...payload };
  if (payload.code) {
    updateData.code = payload.code.trim().toUpperCase();
  }
  if (payload.expiresAt !== undefined) {
    updateData.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }

  const result = await prisma.coupon.update({
    where: { id },
    data: updateData,
  });

  return result;
};

const deleteCouponFromDB = async (id: number) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
  }

  await prisma.coupon.delete({ where: { id } });
  return true;
};

/**
 * Validates a coupon code against a cart total and returns calculated discount
 */
const validateCouponInDB = async (payload: TValidateCouponPayload) => {
  const normalizedCode = payload.code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon || !coupon.isActive) {
    throw new AppError(httpStatus.NOT_FOUND, 'Invalid or inactive coupon code!');
  }

  // Check expiration
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This coupon code has expired!');
  }

  // Check global usage limit
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This coupon has reached its total usage limit!');
  }

  // Check minimum order amount requirement
  if (coupon.minOrderAmount != null && payload.cartTotal < coupon.minOrderAmount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum order amount of ৳${coupon.minOrderAmount} required to apply this coupon!`
    );
  }

  // Check per-user limit if userId is provided
  if (payload.userId && coupon.perUserLimit) {
    const userUsage = await prisma.order.count({
      where: {
        userId: payload.userId,
        couponId: coupon.id,
      },
    });

    if (userUsage >= coupon.perUserLimit) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You have already reached the maximum usage limit (${coupon.perUserLimit} time(s)) for this coupon!`
      );
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
    discountAmount = (payload.cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount != null && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    // FIXED_AMOUNT
    discountAmount = Math.min(coupon.discountValue, payload.cartTotal);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalTotal = Math.max(0, Math.round((payload.cartTotal - discountAmount) * 100) / 100);

  return {
    couponId: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalTotal,
  };
};

export const CouponService = {
  createCouponInDB,
  getAllCouponsFromDB,
  getCouponByIdFromDB,
  updateCouponInDB,
  deleteCouponFromDB,
  validateCouponInDB,
};

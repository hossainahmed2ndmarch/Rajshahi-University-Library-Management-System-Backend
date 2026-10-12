import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CouponService } from './coupon.service';

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.createCouponInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Coupon created successfully!',
    data: result,
  });
});

const getAllCoupons = catchAsync(async (_req: Request, res: Response) => {
  const result = await CouponService.getAllCouponsFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupons retrieved successfully!',
    data: result,
  });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getCouponByIdFromDB(Number(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon retrieved successfully!',
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.updateCouponInDB(Number(req.params.id), req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully!',
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  await CouponService.deleteCouponFromDB(Number(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon deleted successfully!',
    data: null,
  });
});

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const payload = {
    ...req.body,
    userId: user?.id || user?.userId || req.body.userId,
  };
  const result = await CouponService.validateCouponInDB(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon validated successfully!',
    data: result,
  });
});

export const CouponController = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};

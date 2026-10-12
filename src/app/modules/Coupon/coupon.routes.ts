import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CouponController } from './coupon.controller';
import { CouponValidation } from './coupon.validation';

const router = Router();

// Public / Authenticated validation of coupon code
router.post(
  '/validate',
  validateRequest(CouponValidation.validateCouponValidationSchema),
  CouponController.validateCoupon
);

// Admin-only CRUD operations
router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(CouponValidation.createCouponValidationSchema),
  CouponController.createCoupon
);

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  CouponController.getAllCoupons
);

router.get(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  CouponController.getCouponById
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(CouponValidation.updateCouponValidationSchema),
  CouponController.updateCoupon
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CouponController.deleteCoupon
);

export const CouponRoutes = router;

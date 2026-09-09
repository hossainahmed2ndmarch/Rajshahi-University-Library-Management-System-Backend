import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PurchaseController } from './purchase.controller';
import { PurchaseValidation } from './purchase.validation';

const router = Router();

// Guest Endpoints
router.post(
  '/guest',
  validateRequest(PurchaseValidation.guestPurchaseValidationSchema),
  PurchaseController.createGuestPurchase
);

router.post(
  '/guest/orders',
  validateRequest(PurchaseValidation.guestOrdersLookupValidationSchema),
  PurchaseController.getGuestOrders
);

router.get(
  '/guest/track/:transactionId',
  PurchaseController.trackGuestOrder
);

router.post(
  '/guest/cancel',
  validateRequest(PurchaseValidation.guestCancelOrderValidationSchema),
  PurchaseController.cancelGuestPurchase
);

// Member / Authenticated Purchase Endpoints
router.post(
  '/',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  validateRequest(PurchaseValidation.memberPurchaseValidationSchema),
  PurchaseController.createMemberPurchase
);

router.post(
  '/member',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  validateRequest(PurchaseValidation.memberPurchaseValidationSchema),
  PurchaseController.createMemberPurchase
);

router.get(
  '/my-purchases',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  PurchaseController.getMyPurchases
);

router.patch(
  '/:id/cancel',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  PurchaseController.cancelMemberPurchase
);

// POS Desk In-Person Book Sales (Staff)
router.post(
  '/pos',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(PurchaseValidation.posSaleValidationSchema),
  PurchaseController.createPOSSale
);

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  PurchaseController.getAllPurchases
);

router.patch(
  '/:id/status',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  PurchaseController.updatePurchaseStatus
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PurchaseController.deletePurchase
);

export const PurchaseRoutes = router;



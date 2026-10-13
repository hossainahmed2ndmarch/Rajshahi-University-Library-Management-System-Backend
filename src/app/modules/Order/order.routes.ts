import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';

const router = Router();

// 1. Create order (Public / Authenticated guests & patrons)
router.post(
  '/',
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderController.createOrder
);

// 2. Track order by orderCode or trackingNumber (Public)
router.get('/track/:orderCode', OrderController.trackOrderByCode);

// 3. Public Courier Delivery OTP Verification
// (Courier rider scans QR or visits /delivery/verify with tracking code + customer's OTP)
router.post(
  '/verify-delivery-otp',
  validateRequest(OrderValidation.verifyDeliveryOtpValidationSchema),
  OrderController.verifyDeliveryOtp
);

// 4. Authenticated: Patron personal orders
router.get(
  '/my-orders',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  OrderController.getMyOrders
);

// 5. Staff: List all normalized orders
router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  OrderController.getAllOrders
);

// 6. Staff: Get single order by id
router.get(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  OrderController.getOrderById
);

// 7. Staff: Update order status
router.patch(
  '/:id/status',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(OrderValidation.updateOrderStatusValidationSchema),
  OrderController.updateOrderStatus
);

// 8. Staff: Verify manual MFS payment
router.patch(
  '/:id/verify-payment',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(OrderValidation.verifyOrderPaymentValidationSchema),
  OrderController.verifyOrderPayment
);

// 9. Staff: Dispatch parcel via Steadfast Courier & send OTP
router.post(
  '/:id/dispatch-courier',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  OrderController.dispatchCourier
);

// 10. Staff: Verify Delivery OTP by order ID
router.post(
  '/:id/verify-otp',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(OrderValidation.verifyDeliveryOtpValidationSchema),
  OrderController.verifyDeliveryOtp
);

// 11. Customer or Staff: Cancel order
router.patch(
  '/:id/cancel',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  OrderController.cancelOrder
);

// 12. Admin: Delete order record
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  OrderController.deleteOrder
);

export const OrderRoutes = router;

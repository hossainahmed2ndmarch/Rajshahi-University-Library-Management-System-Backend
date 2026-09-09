import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { PaymentController } from './payment.controller';

const router = Router();

router.post(
  '/initiate-membership',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PaymentController.initiateMembershipPayment
);

router.post('/success', PaymentController.handleSuccess);
router.get('/success', PaymentController.handleSuccess);

router.post('/fail', PaymentController.handleFail);
router.get('/fail', PaymentController.handleFail);

router.post('/cancel', PaymentController.handleCancel);
router.get('/cancel', PaymentController.handleCancel);

router.post('/ipn', PaymentController.handleIPN);

export const PaymentRoutes = router;

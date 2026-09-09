import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { DonationController } from './donation.controller';
import { DonationValidation } from './donation.validation';

const router = Router();

router.post(
  '/',
  optionalAuth,
  validateRequest(DonationValidation.createDonationValidationSchema),
  DonationController.createDonation
);

router.post(
  '/pos',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(DonationValidation.posDonationValidationSchema),
  DonationController.createPOSDonation
);

router.patch(
  '/:id/approve',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  DonationController.approveDonation
);

router.patch(
  '/:id/reject',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  DonationController.rejectDonation
);

router.post(
  '/:id/convert',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(DonationValidation.convertDonationValidationSchema),
  DonationController.convertDonationToStock
);

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  DonationController.getAllDonations
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DonationController.deleteDonation
);

export const DonationRoutes = router;


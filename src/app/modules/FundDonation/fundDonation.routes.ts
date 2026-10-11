import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { FundDonationController } from './fundDonation.controller';
import { FundDonationValidation } from './fundDonation.validation';

const router = Router();

// --- Public Endpoints ---
router.post(
  '/initiate',
  optionalAuth,
  validateRequest(FundDonationValidation.initiateDonationValidationSchema),
  FundDonationController.initiateDonation
);

router.get('/campaigns', FundDonationController.getPublicCampaigns);
router.get('/donors', FundDonationController.getPublicRecentDonors);
router.get('/receipt/:identifier', FundDonationController.getDonationByReceipt);

// --- Payment Gateway Callbacks (Public) ---
router.post('/success', FundDonationController.handleSuccess);
router.get('/success', FundDonationController.handleSuccess);

router.post('/fail', FundDonationController.handleFail);
router.get('/fail', FundDonationController.handleFail);

router.post('/cancel', FundDonationController.handleCancel);
router.get('/cancel', FundDonationController.handleCancel);

router.post('/ipn', FundDonationController.handleIPN);

// --- Admin & Super Admin Protected Endpoints ---
router.get(
  '/stats',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FundDonationController.getDonationStats
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FundDonationController.getAllDonations
);

router.post(
  '/manual',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(FundDonationValidation.createManualDonationValidationSchema),
  FundDonationController.createManualDonation
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FundDonationController.getDonationById
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(FundDonationValidation.updateDonationValidationSchema),
  FundDonationController.updateDonation
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  FundDonationController.deleteDonation
);

export const FundDonationRoutes = router;

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RudcMemberController } from './rudcMember.controller';
import { RudcMemberValidation } from './rudcMember.validation';

const router = Router();

// Public / Guest / Member Application
router.post(
  '/apply',
  optionalAuth,
  validateRequest(RudcMemberValidation.applyRudcZodSchema),
  RudcMemberController.applyForRudc
);

// Public Stats for landing page
router.get('/stats', RudcMemberController.getPublicRudcStats);

// Logged-in Volunteer / Member profile
router.get(
  '/my-profile',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  RudcMemberController.getMyRudcProfile
);

// Interview Notification Email
router.post(
  '/send-interview-email',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(RudcMemberValidation.sendInterviewEmailZodSchema),
  RudcMemberController.sendInterviewEmail
);

// Pre-existed RUDC Member Entry
router.post(
  '/pre-existed',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(RudcMemberValidation.createPreExistedRudcMemberZodSchema),
  RudcMemberController.createPreExistedRudcMember
);

// Member Management
router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  RudcMemberController.getAllRudcMembers
);

router.get(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  RudcMemberController.getRudcMemberById
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(RudcMemberValidation.updateRudcMemberZodSchema),
  RudcMemberController.updateRudcMember
);

export const RudcMemberRoutes = router;

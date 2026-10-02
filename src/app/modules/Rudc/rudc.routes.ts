import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RudcMemberController } from '../RudcMember/rudcMember.controller';
import { RudcMemberValidation } from '../RudcMember/rudcMember.validation';
import { RudcMemberRoutes } from '../RudcMember/rudcMember.routes';
import { RudcTeamRoutes } from '../RudcTeam/rudcTeam.routes';
import { RudcIyanotRoutes } from '../RudcIyanot/rudcIyanot.routes';

const router = Router();

// Unified /rudc shortcuts for backwards compatibility
router.post(
  '/apply',
  optionalAuth,
  validateRequest(RudcMemberValidation.applyRudcZodSchema),
  RudcMemberController.applyForRudc
);

router.get('/stats', RudcMemberController.getPublicRudcStats);

router.get(
  '/my-profile',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  RudcMemberController.getMyRudcProfile
);

router.post(
  '/send-interview-email',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(RudcMemberValidation.sendInterviewEmailZodSchema),
  RudcMemberController.sendInterviewEmail
);

// Modular Sub-routes
router.use('/members', RudcMemberRoutes);
router.use('/teams', RudcTeamRoutes);
router.use('/iyanot', RudcIyanotRoutes);

export const RudcRoutes = router;

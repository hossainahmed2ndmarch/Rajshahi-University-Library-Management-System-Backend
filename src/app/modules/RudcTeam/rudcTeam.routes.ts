import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RudcTeamController } from './rudcTeam.controller';
import { RudcTeamValidation } from './rudcTeam.validation';

const router = Router();

// List teams: accessible to authenticated users
router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  RudcTeamController.getAllRudcTeams
);

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(RudcTeamValidation.rudcTeamZodSchema),
  RudcTeamController.createRudcTeam
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  RudcTeamController.updateRudcTeam
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  RudcTeamController.deleteRudcTeam
);

router.post(
  '/assign',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(RudcTeamValidation.assignTeamMembersZodSchema),
  RudcTeamController.assignTeamMembers
);

router.delete(
  '/:teamId/members/:userId',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  RudcTeamController.removeTeamMember
);

export const RudcTeamRoutes = router;

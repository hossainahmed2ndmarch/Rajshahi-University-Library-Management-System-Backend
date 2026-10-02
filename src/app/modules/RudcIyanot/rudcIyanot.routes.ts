import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RudcIyanotController } from './rudcIyanot.controller';
import { RudcIyanotValidation } from './rudcIyanot.validation';

const router = Router();

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  RudcIyanotController.getRudcIyanotRecords
);

router.post(
  '/record',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  validateRequest(RudcIyanotValidation.recordIyanotZodSchema),
  RudcIyanotController.recordIyanotPayment
);

export const RudcIyanotRoutes = router;

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ShiftLogController } from './shiftLog.controller';
import { ShiftLogValidation } from './shiftLog.validation';

const router = Router();

// 1. Check in / start duty shift (status: ACTIVE)
router.post(
  '/check-in',
  auth(UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(ShiftLogValidation.checkInValidationSchema),
  ShiftLogController.checkInShift
);

// 2. Check out / end duty shift (status: COMPLETED)
router.post(
  '/check-out',
  auth(UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(ShiftLogValidation.checkOutValidationSchema),
  ShiftLogController.checkOutShift
);

// 3. Schedule duty shift in advance & notify staff
router.post(
  '/schedule',
  auth(UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(ShiftLogValidation.scheduleShiftValidationSchema),
  ShiftLogController.scheduleShift
);

// 4. Cancel scheduled duty shift in advance & notify staff
router.patch(
  '/cancel/:id',
  auth(UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(ShiftLogValidation.cancelShiftValidationSchema),
  ShiftLogController.cancelShift
);

// 5. Get all shift audit records
router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  ShiftLogController.getAllShiftLogs
);

// 6. Delete shift audit log after audit (Admin / Super Admin)
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ShiftLogController.deleteShiftLog
);

export const ShiftLogRoutes = router;

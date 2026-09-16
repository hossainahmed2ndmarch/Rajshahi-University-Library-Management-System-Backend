import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ShifterScheduleController } from './shifterSchedule.controller';
import { ShifterScheduleValidation } from './shifterSchedule.validation';

const router = Router();

// 1. Public — for home page, contact page, weekly roster modal
router.get('/', ShifterScheduleController.getAllSchedules);
router.get('/today', ShifterScheduleController.getTodaySchedule);

// 2. Authenticated — own schedule
router.get(
  '/my',
  auth(UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ShifterScheduleController.getMySchedule
);
router.get(
  '/my-schedule',
  auth(UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ShifterScheduleController.getMySchedule
);

// 3. Admin / Super Admin — create schedule assignment
router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(ShifterScheduleValidation.createScheduleSchema),
  ShifterScheduleController.createSchedule
);

// 4. Admin / Super Admin / Shifter — update own slot
router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  validateRequest(ShifterScheduleValidation.updateScheduleSchema),
  ShifterScheduleController.updateSchedule
);

// 5. Admin / Super Admin — delete slot
router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ShifterScheduleController.deleteSchedule
);

export const ShifterScheduleRoutes = router;

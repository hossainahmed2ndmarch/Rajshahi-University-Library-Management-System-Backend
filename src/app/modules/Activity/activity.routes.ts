import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadActivityBanner } from '../../middlewares/uploadImage';
import { ActivityController } from './activity.controller';
import { ActivityValidation } from './activity.validation';

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', ActivityController.getAllActivities);
router.get('/categories', ActivityController.getCategories);
router.get('/:idOrSlug', ActivityController.getActivityById);

// ── Admin + Super Admin Routes ────────────────────────────────────────────────
router.post(
  '/upload-banner',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadActivityBanner,
  ActivityController.uploadBanner,
);

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(ActivityValidation.createActivityValidationSchema),
  ActivityController.createActivity,
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(ActivityValidation.updateActivityValidationSchema),
  ActivityController.updateActivity,
);

// ── Super Admin Only ──────────────────────────────────────────────────────────
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN),
  ActivityController.deleteActivity,
);

export const ActivityRoutes = router;

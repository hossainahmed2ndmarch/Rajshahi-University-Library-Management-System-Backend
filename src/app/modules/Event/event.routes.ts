import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadEventBanner } from '../../middlewares/uploadImage';
import { EventController } from './event.controller';
import { EventValidation } from './event.validation';

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', EventController.getAllEvents);
router.get('/categories', EventController.getCategories);
router.get('/:idOrSlug', EventController.getEventByIdOrSlug);

// ── Admin + Super Admin Routes ────────────────────────────────────────────────
router.post(
  '/upload-banner',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadEventBanner,
  EventController.uploadBanner,
);

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(EventValidation.createEventValidationSchema),
  EventController.createEvent,
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(EventValidation.updateEventValidationSchema),
  EventController.updateEvent,
);

// ── Super Admin Only ──────────────────────────────────────────────────────────
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN),
  EventController.deleteEvent,
);

export const EventRoutes = router;

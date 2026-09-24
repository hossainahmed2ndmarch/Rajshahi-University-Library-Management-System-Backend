import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { EventSessionController } from './eventSession.controller';
import { EventSessionValidation } from './eventSession.validation';

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', EventSessionController.getSessionsByEvent);
router.get('/event/:eventId', EventSessionController.getSessionsByEvent);
router.get('/:id', EventSessionController.getSessionById);

// ── Admin + Super Admin Routes ────────────────────────────────────────────────
router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(EventSessionValidation.createEventSessionValidationSchema),
  EventSessionController.createSession,
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(EventSessionValidation.updateEventSessionValidationSchema),
  EventSessionController.updateSession,
);

// ── Super Admin Only ──────────────────────────────────────────────────────────
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN),
  EventSessionController.deleteSession,
);

export const EventSessionRoutes = router;

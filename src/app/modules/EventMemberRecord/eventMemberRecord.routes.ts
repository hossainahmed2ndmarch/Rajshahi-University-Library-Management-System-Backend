import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { EventMemberRecordController } from './eventMemberRecord.controller';
import { EventMemberRecordValidation } from './eventMemberRecord.validation';

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/stats/:eventId', optionalAuth, EventMemberRecordController.getEventStats);

// ── Authenticated User Routes ─────────────────────────────────────────────────
router.get('/my-records', auth(), EventMemberRecordController.getMyRecords);

router.post(
  '/self-attendance',
  auth(),
  validateRequest(EventMemberRecordValidation.selfAttendanceValidationSchema),
  EventMemberRecordController.selfAttendance,
);

router.post(
  '/feedback',
  auth(),
  validateRequest(EventMemberRecordValidation.submitFeedbackValidationSchema),
  EventMemberRecordController.submitFeedback,
);

// ── Admin & Super Admin Management Routes ────────────────────────────────────
router.get(
  '/event/:eventId',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  EventMemberRecordController.getRecordsByEvent,
);

router.post(
  '/bulk-attendance',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(EventMemberRecordValidation.bulkAttendanceValidationSchema),
  EventMemberRecordController.bulkMarkAttendance,
);

router.patch(
  '/approve/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(EventMemberRecordValidation.approveFeedbackValidationSchema),
  EventMemberRecordController.approveFeedback,
);

export const EventMemberRecordRoutes = router;

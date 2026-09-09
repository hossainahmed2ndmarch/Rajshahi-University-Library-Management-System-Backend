import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

router.post(
  '/',
  optionalAuth,
  validateRequest(ReviewValidation.createBookReviewValidationSchema),
  ReviewController.createBookReview
);

router.post(
  '/book',
  optionalAuth,
  validateRequest(ReviewValidation.createBookReviewValidationSchema),
  ReviewController.createBookReview
);

router.post(
  '/service',
  optionalAuth,
  validateRequest(ReviewValidation.createServiceReviewValidationSchema),
  ReviewController.createServiceReview
);

router.get(
  '/service',
  ReviewController.getServiceReviews
);

router.get(
  '/book/:bookId',
  ReviewController.getBookReviews
);

router.get(
  '/all',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  ReviewController.getAllReviews
);

router.patch(

  '/:id',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  ReviewController.updateReview
);

router.delete(
  '/:id',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  ReviewController.deleteReview
);

export const ReviewRoutes = router;

import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadPublisherLogo } from '../../middlewares/uploadImage';
import { PublisherController } from './publisher.controller';
import { PublisherValidation } from './publisher.validation';

const router = Router();

// Public Read
router.get('/', PublisherController.getAllPublishers);
router.get('/:id', PublisherController.getPublisherById);

// Upload Logo
router.post(
  '/upload-logo',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  uploadPublisherLogo,
  PublisherController.uploadLogo
);

// Staff Management (Shifter, Admin, Super Admin)
router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(PublisherValidation.createPublisherValidationSchema),
  PublisherController.createPublisher
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(PublisherValidation.updatePublisherValidationSchema),
  PublisherController.updatePublisher
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PublisherController.deletePublisher
);

export const PublisherRoutes = router;

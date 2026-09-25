import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadGalleryMedia } from '../../middlewares/uploadImage';
import { GalleryController } from './gallery.controller';
import { GalleryValidation } from './gallery.validation';

const router = Router();

// ── Public Routes ────────────────────────────────────────────────────────────
router.get('/', GalleryController.getAllGalleryItems);
router.get('/assets', GalleryController.getAllAssets);
router.get('/asset/:key', GalleryController.getAssetByKey);
router.get('/categories', GalleryController.getCategories);
router.get('/:id', GalleryController.getGalleryItemById);

// ── Admin & Super Admin Routes ───────────────────────────────────────────────
router.post(
  '/upload',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadGalleryMedia,
  GalleryController.uploadMedia,
);

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(GalleryValidation.createGalleryItemValidationSchema),
  GalleryController.createGalleryItem,
);

router.put(
  '/asset/:key',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(GalleryValidation.setAssetValidationSchema),
  GalleryController.upsertAsset,
);

router.patch(
  '/:id/toggle-publish',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  GalleryController.togglePublish,
);

router.patch(
  '/:id/toggle-feature',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  GalleryController.toggleFeature,
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(GalleryValidation.updateGalleryItemValidationSchema),
  GalleryController.updateGalleryItem,
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  GalleryController.deleteGalleryItem,
);

export const GalleryRoutes = router;

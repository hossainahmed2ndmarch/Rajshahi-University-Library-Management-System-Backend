import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BookController } from './book.controller';
import { BookValidation } from './book.validation';
import { uploadBookCover, uploadMultipleBookImages } from '../../middlewares/uploadImage';

const router = Router();

// ── Upload book cover image to Cloudinary ─────────────────────────────────────
router.post(
  '/upload-cover',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  uploadBookCover,
  BookController.uploadBookCover
);

// ── Upload multiple book images to Cloudinary ─────────────────────────────────
router.post(
  '/upload-images',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  uploadMultipleBookImages,
  BookController.uploadBookImages
);

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(BookValidation.createBookValidationSchema),
  BookController.createBook
);

router.get('/', BookController.getAllBooks);

router.get('/categories', BookController.getBookCategories);

router.get('/:id', BookController.getBookById);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(BookValidation.updateBookValidationSchema),
  BookController.updateBook
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BookController.deleteBook
);

export const BookRoutes = router;

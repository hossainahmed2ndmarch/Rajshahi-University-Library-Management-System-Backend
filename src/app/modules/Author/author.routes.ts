import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadAuthorAvatar } from '../../middlewares/uploadImage';
import { AuthorController } from './author.controller';
import { AuthorValidation } from './author.validation';

const router = Router();

// Public Read
router.get('/', AuthorController.getAllAuthors);
router.get('/:id', AuthorController.getAuthorById);

// Upload Avatar
router.post(
  '/upload-avatar',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  uploadAuthorAvatar,
  AuthorController.uploadAvatar
);

// Staff Management (Shifter, Admin, Super Admin)
router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(AuthorValidation.createAuthorValidationSchema),
  AuthorController.createAuthor
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(AuthorValidation.updateAuthorValidationSchema),
  AuthorController.updateAuthor
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthorController.deleteAuthor
);

export const AuthorRoutes = router;

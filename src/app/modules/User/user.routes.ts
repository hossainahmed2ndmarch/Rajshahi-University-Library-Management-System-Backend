import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadAvatar } from '../../middlewares/uploadImage';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

router.post(
  '/register',
  validateRequest(UserValidation.registerMemberValidationSchema),
  UserController.registerUser
);

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  UserController.getAllUsers
);

router.get(
  '/me',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  UserController.getMe
);

router.patch(
  '/profile',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  validateRequest(UserValidation.updateMyProfileValidationSchema),
  UserController.updateMyProfile
);

router.post(
  '/avatar',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  uploadAvatar,
  UserController.uploadAvatar
);

router.post(
  '/renew-membership',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  validateRequest(UserValidation.renewMembershipValidationSchema),
  UserController.renewMembership
);

router.get(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  UserController.getUserById
);

router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

router.patch(
  '/:id/approve-cash',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  UserController.approveCashPayment
);

router.post(
  '/:id/send-notice',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.sendNoticeToUser
);

router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.deleteUser
);

export const UserRoutes = router;

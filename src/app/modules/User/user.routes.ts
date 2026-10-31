import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadAvatar } from '../../middlewares/uploadImage';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

// 1. Public Statistics (No login required - member counts for landing pages)
router.get('/public-stats', UserController.getPublicStats);

// 2. Member & User Registration
router.post(
  '/register',
  validateRequest(UserValidation.registerMemberValidationSchema),
  UserController.registerUser
);

// 3. Bulk Manual Registration by Admin / Shifter
router.post(
  '/bulk-register',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  UserController.registerBulkMembers
);

// 4. Listing & Profile Access
router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  UserController.getAllUsers
);

router.get(
  '/me',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER, UserRole.GENERAL_USER),
  UserController.getMe
);

router.patch(
  '/profile',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER, UserRole.GENERAL_USER),
  validateRequest(UserValidation.updateMyProfileValidationSchema),
  UserController.updateMyProfile
);

router.post(
  '/avatar',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER, UserRole.GENERAL_USER),
  uploadAvatar,
  UserController.uploadAvatar
);

router.post(
  '/renew-membership',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  validateRequest(UserValidation.renewMembershipValidationSchema),
  UserController.renewMembership
);

// 5. Bulk Actions for Admin
router.post(
  '/convert-membership',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.convertMembership
);

router.patch(
  '/bulk-update',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.bulkUpdateUsers
);

router.post(
  '/bulk-delete',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.bulkDeleteUsers
);

router.get(
  '/notice-templates',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  UserController.getEmailNoticeTemplates
);

router.post(
  '/send-custom-notice',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.sendCustomNotice
);

router.get(
  '/options',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER, UserRole.MEMBER),
  UserController.getUserOptions
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

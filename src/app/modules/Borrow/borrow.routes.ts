import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BorrowController } from './borrow.controller';
import { BorrowValidation } from './borrow.validation';

const router = Router();

// 1. Member / Any user requests to borrow a book
router.post(
  '/',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  validateRequest(BorrowValidation.createBorrowValidationSchema),
  BorrowController.createBorrow
);

// 2. Direct book issue by Shifter / Admin / Super Admin
router.post(
  '/issue',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  BorrowController.issueBook
);

// 3. Member fetches their own borrow records
router.get(
  '/my-borrows',
  auth(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SHIFTER),
  BorrowController.getMyBorrows
);

// 4. Staff fetches all borrow records
router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  BorrowController.getAllBorrows
);

// 5. Staff triggers overdue check & notifications manually/programmatically
router.post(
  '/check-overdue',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  BorrowController.checkOverdueBorrows
);

// 6. Staff approves borrow request (calculates due date & decrements stock)
router.patch(
  '/approve/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  BorrowController.approveBorrow
);

// 7. Staff rejects borrow request
router.patch(
  '/reject/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  BorrowController.rejectBorrow
);

// 8. Staff processes book return (restores stock & sets return date)
router.patch(
  '/return/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER),
  validateRequest(BorrowValidation.returnBorrowValidationSchema),
  BorrowController.returnBook
);

// 9. Super Admin & Admin delete borrow audit record
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BorrowController.deleteBorrow
);

export const BorrowRoutes = router;

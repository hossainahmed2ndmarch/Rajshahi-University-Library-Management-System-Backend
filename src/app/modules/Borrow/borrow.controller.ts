import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BorrowService } from './borrow.service';

const createBorrow = catchAsync(async (req: Request, res: Response) => {
  const userId = req.body.userId ? Number(req.body.userId) : Number(req.user?.userId || req.user?.id);
  const result = await BorrowService.createBorrowInDB(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Borrow request submitted successfully! Pending shifter/admin approval.',
    data: result,
  });
});

const issueBook = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await BorrowService.issueBookDirectlyInDB(
    {
      bookId: Number(req.body.bookId),
      memberId: req.body.memberId ? Number(req.body.memberId) : undefined,
      studentOrVoterId: req.body.studentOrVoterId,
      memberPhone: req.body.memberPhone,
      memberEmail: req.body.memberEmail,
      dueDate: req.body.dueDate,
      notes: req.body.notes,
    },
    shifterId
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Book issued directly to member successfully at counter desk!',
    data: result,
  });
});

const returnBook = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const returnedById = Number(req.user?.userId || req.user?.id);
  const result = await BorrowService.returnBookInDB(Number(id), returnedById, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book returned successfully and inventory updated!',
    data: result,
  });
});

const getMyBorrows = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const scopedQuery = { ...req.query, userId: String(userId) };
  const user = {
    userId,
    role: 'MEMBER',
  };
  const result = await BorrowService.getAllBorrowsFromDB(scopedQuery, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My borrow history retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const approveBorrow = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const approvedById = Number(req.user?.userId || req.user?.id);
  const result = await BorrowService.approveBorrowInDB(Number(id), approvedById);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Borrow request approved successfully with dynamic due date!',
    data: result,
  });
});

const rejectBorrow = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BorrowService.rejectBorrowInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Borrow request rejected successfully!',
    data: result,
  });
});

const getAllBorrows = catchAsync(async (req: Request, res: Response) => {
  const user = {
    userId: Number(req.user?.userId || req.user?.id),
    role: req.user?.role as string,
  };
  const result = await BorrowService.getAllBorrowsFromDB(req.query, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All borrow records retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const checkOverdueBorrows = catchAsync(async (req: Request, res: Response) => {
  const result = await BorrowService.checkOverdueBorrowsAndNotify();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Overdue check executed! Processed ${result.totalChecked} overdue borrow(s).`,
    data: result,
  });
});

const deleteBorrow = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BorrowService.deleteBorrowInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Borrow record deleted successfully!',
    data: result,
  });
});

export const BorrowController = {
  createBorrow,
  issueBook,
  approveBorrow,
  rejectBorrow,
  returnBook,
  getMyBorrows,
  getAllBorrows,
  checkOverdueBorrows,
  deleteBorrow,
};

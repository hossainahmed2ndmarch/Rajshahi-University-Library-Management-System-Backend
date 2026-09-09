import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { UserRole } from '@prisma/client';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ShiftLogService } from './shiftLog.service';

const checkInShift = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await ShiftLogService.checkInShiftInDB(shifterId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shift check-in successful! Duty desk is now ACTIVE.',
    data: result,
  });
});

const checkOutShift = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await ShiftLogService.checkOutShiftInDB(shifterId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shift check-out & cash reconciliation completed successfully!',
    data: result,
  });
});

const scheduleShift = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await ShiftLogService.scheduleShiftInDB(shifterId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `Duty shift scheduled in advance! Notification dispatched to ${result.notifiedCount} staff members.`,
    data: result,
  });
});

const cancelShift = catchAsync(async (req: Request, res: Response) => {
  const currentUser = {
    userId: Number(req.user?.userId || req.user?.id),
    role: req.user?.role as UserRole,
  };
  const shiftId = Number(req.params.id);
  const result = await ShiftLogService.cancelShiftInDB(shiftId, currentUser, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Duty shift cancelled. Notification dispatched to ${result.notifiedCount} staff members.`,
    data: result,
  });
});

const getAllShiftLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await ShiftLogService.getAllShiftLogsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shift logs retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const deleteShiftLog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShiftLogService.deleteShiftLogInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shift audit log deleted successfully!',
    data: result,
  });
});

export const ShiftLogController = {
  checkInShift,
  checkOutShift,
  scheduleShift,
  cancelShift,
  getAllShiftLogs,
  deleteShiftLog,
};

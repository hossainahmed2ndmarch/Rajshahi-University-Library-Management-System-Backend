import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RudcIyanotService } from './rudcIyanot.service';

const getRudcIyanotRecords = catchAsync(async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const user = {
    id: Number(reqUser?.userId || reqUser?.id),
    role: reqUser?.role,
  };
  const result = await RudcIyanotService.getRudcIyanotRecords(req.query, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Iyanot records retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const recordIyanotPayment = catchAsync(async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const actingUser = {
    id: Number(reqUser?.userId || reqUser?.id),
    role: reqUser?.role,
  };
  const result = await RudcIyanotService.recordIyanotPayment(req.body, actingUser);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'RUDC Iyanot payment recorded successfully!',
    data: result,
  });
});

export const RudcIyanotController = {
  getRudcIyanotRecords,
  recordIyanotPayment,
};

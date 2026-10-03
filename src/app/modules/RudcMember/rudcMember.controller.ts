import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RudcMemberService } from './rudcMember.service';

const applyForRudc = catchAsync(async (req: Request, res: Response) => {
  const requestingUserId = (req as any).user?.id;
  const result = await RudcMemberService.applyForRudc(req.body, requestingUserId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'RUDC Volunteer application submitted successfully!',
    data: result,
  });
});

const getMyRudcProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = Number((req as any).user?.userId || (req as any).user?.id);
  const result = await RudcMemberService.getMyRudcProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My RUDC Profile retrieved successfully!',
    data: result,
  });
});

const sendInterviewEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcMemberService.sendInterviewEmail(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Interview notifications processed. (${result.successCount} sent, ${result.failedCount} failed)`,
    data: result,
  });
});

const getAllRudcMembers = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcMemberService.getAllRudcMembers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Members retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getRudcMemberById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RudcMemberService.getRudcMemberById(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Member details retrieved successfully!',
    data: result,
  });
});

const updateRudcMember = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RudcMemberService.updateRudcMember(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Member updated successfully!',
    data: result,
  });
});

const createPreExistedRudcMember = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcMemberService.createPreExistedRudcMember(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Pre-existed RUDC Member recorded successfully!',
    data: result,
  });
});

const getPublicRudcStats = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcMemberService.getPublicRudcStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Public RUDC statistics fetched successfully!',
    data: result,
  });
});

export const RudcMemberController = {
  applyForRudc,
  getMyRudcProfile,
  sendInterviewEmail,
  getAllRudcMembers,
  getRudcMemberById,
  updateRudcMember,
  createPreExistedRudcMember,
  getPublicRudcStats,
};

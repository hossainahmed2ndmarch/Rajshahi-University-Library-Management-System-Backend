import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { UserService } from './user.service';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.registerMember(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Member registered successfully!',
    data: result,
  });
});

const registerBulkMembers = catchAsync(async (req: Request, res: Response) => {
  const { members, targetOrg } = req.body;
  const result = await UserService.registerBulkMembersInDB(members, targetOrg);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Bulk members processed successfully!',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.getUserByIdFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully!',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const authUser = req.user
    ? { role: req.user.role as any, userId: String(req.user.userId || req.user.id) }
    : undefined;
  const result = await UserService.updateUserInDB(id, req.body, authUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile updated successfully!',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id);
  const result = await UserService.getUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authenticated user profile retrieved successfully!',
    data: result,
  });
});

const approveCashPayment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.approveCashPaymentInDB(id, req.body?.amount);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cash payment recorded and member activated successfully!',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id);
  const result = await UserService.updateMyProfileInDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully!',
    data: result,
  });
});

const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id);
  const file = req.file;

  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please select an image file to upload!');
  }

  const avatarUrl = ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  if (!avatarUrl) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve uploaded image URL.');
  }

  const result = await UserService.updateMyProfileInDB(userId, { avatarUrl });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile photo uploaded and updated successfully!',
    data: result,
  });
});

const renewMembership = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.user?.userId || req.user?.id);
  const result = await UserService.renewMembershipInDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Membership renewed successfully!',
    data: result,
  });
});

const sendNoticeToUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserService.sendNoticeToUserInDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notice alert sent to user successfully!',
    data: result,
  });
});

const sendCustomNotice = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.sendCustomNoticeInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customizable email notice dispatched successfully!',
    data: result,
  });
});

const getEmailNoticeTemplates = catchAsync(async (_req: Request, res: Response) => {
  const result = await UserService.getEmailNoticeTemplatesInDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notice templates retrieved successfully!',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const requestingUserId = String(req.user?.userId || req.user?.id);
  const result = await UserService.deleteUserFromDB(id, requestingUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User account deleted successfully!',
    data: result,
  });
});

const getUserOptions = catchAsync(async (_req: Request, res: Response) => {
  const result = await UserService.getUserOptionsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User departments, sessions, and options retrieved successfully!',
    data: result,
  });
});

const convertMembership = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.convertMembershipInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Membership converted successfully for selected member(s)!',
    data: result,
  });
});

const bulkUpdateUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.bulkUpdateUsersInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users updated in bulk successfully!',
    data: result,
  });
});

const bulkDeleteUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.bulkDeleteUsersInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users deleted in bulk successfully!',
    data: result,
  });
});

const getPublicStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await UserService.getPublicStatsInDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Public statistics retrieved successfully!',
    data: result,
  });
});

export const UserController = {
  registerUser,
  registerBulkMembers,
  getAllUsers,
  getUserById,
  getUserOptions,
  getMe,
  updateUser,
  updateMyProfile,
  uploadAvatar,
  renewMembership,
  convertMembership,
  approveCashPayment,
  sendNoticeToUser,
  sendCustomNotice,
  getEmailNoticeTemplates,
  bulkUpdateUsers,
  bulkDeleteUsers,
  deleteUser,
  getPublicStats,
};

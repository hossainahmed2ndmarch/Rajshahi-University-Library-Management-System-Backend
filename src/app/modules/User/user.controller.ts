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
    message: 'Member registered successfully! Pending payment or approval.',
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
  const { id } = req.params;
  const result = await UserService.getUserByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully!',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const authUser = req.user
    ? { role: req.user.role as any, userId: Number(req.user.userId || req.user.id) }
    : undefined;
  const result = await UserService.updateUserInDB(Number(id), req.body, authUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile updated successfully!',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const result = await UserService.getUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authenticated user profile retrieved successfully!',
    data: result,
  });
});

const approveCashPayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.approveCashPaymentInDB(Number(id), req.body?.amount);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cash payment recorded and member activated successfully!',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const result = await UserService.updateMyProfileInDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully!',
    data: result,
  });
});

const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const file = req.file;

  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please select an image file to upload!');
  }

  // With CloudinaryStorage, multer sets req.file.path or req.file.secure_url to the Cloudinary HTTPS URL
  const avatarUrl = ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  if (!avatarUrl) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve uploaded image URL from Cloudinary.');
  }

  const result = await UserService.updateMyProfileInDB(userId, { avatarUrl });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile photo uploaded to Cloudinary and updated successfully!',
    data: result,
  });
});


const renewMembership = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const result = await UserService.renewMembershipInDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Membership renewed successfully for 6 months!',
    data: result,
  });
});

const sendNoticeToUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.sendNoticeToUserInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notice alert sent to user successfully!',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUserId = Number(req.user?.userId || req.user?.id);
  const result = await UserService.deleteUserFromDB(Number(id), requestingUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User account deleted successfully from library records!',
    data: result,
  });
});

export const UserController = {
  registerUser,
  getAllUsers,
  getUserById,
  getMe,
  updateUser,
  updateMyProfile,
  uploadAvatar,
  renewMembership,
  approveCashPayment,
  sendNoticeToUser,
  deleteUser,
};

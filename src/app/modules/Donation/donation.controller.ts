import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DonationService } from './donation.service';

const createDonation = catchAsync(async (req: Request, res: Response) => {
  const donorId = req.user?.userId ? Number(req.user.userId) : (req.user?.id ? Number(req.user.id) : undefined);
  const result = await DonationService.createDonationInDB(req.body, donorId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Donation request submitted successfully!',
    data: result,
  });
});

const approveDonation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = Number(req.user?.userId || req.user?.id);
  const result = await DonationService.approveDonationInDB(Number(id), adminId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation received/approved successfully and added to library catalog as borrowable!',
    data: result,
  });
});

const rejectDonation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DonationService.rejectDonationInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation request rejected.',
    data: result,
  });
});

const convertDonationToStock = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = Number(req.user?.userId || req.user?.id);
  const result = await DonationService.convertDonationToStock(Number(id), req.body, adminId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation successfully converted into catalog book stock!',
    data: result,
  });
});

const getAllDonations = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
    ? {
        userId: Number(req.user.userId || req.user.id),
        role: req.user.role as string,
        email: req.user.email as string,
      }
    : undefined;
  const result = await DonationService.getAllDonationsFromDB(req.query, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donations catalog retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const createPOSDonation = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await DonationService.createPOSDonationInDB(req.body, shifterId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'POS in-person donation processed successfully!',
    data: result,
  });
});

const deleteDonation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DonationService.deleteDonationInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation record deleted successfully!',
    data: result,
  });
});

export const DonationController = {
  createDonation,
  createPOSDonation,
  approveDonation,
  rejectDonation,
  convertDonationToStock,
  getAllDonations,
  deleteDonation,
};


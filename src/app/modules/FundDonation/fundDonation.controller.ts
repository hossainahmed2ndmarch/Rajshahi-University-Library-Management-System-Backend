import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import config from '../../config';
import { FundDonationService } from './fundDonation.service';
import { PaymentStatus } from '@prisma/client';

const initiateDonation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId || req.user?.id ? Number(req.user?.userId || req.user?.id) : undefined;
  const result = await FundDonationService.initiateOnlineDonation(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation session initiated successfully!',
    data: result,
  });
});

const handleSuccess = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;

  try {
    await FundDonationService.validatePaymentAndComplete(payload);
  } catch (err: any) {
    console.error('Donation payment success processing error:', err?.message);
  }

  // Redirect to frontend success receipt page
  return res.redirect(`${config.client_url}/rudc/donate/success?tran_id=${tranId}`);
});

const handleFail = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;

  try {
    await FundDonationService.handleFailedPayment(payload, PaymentStatus.FAILED);
  } catch (err: any) {
    console.error('Donation payment fail error:', err?.message);
  }

  return res.redirect(`${config.client_url}/rudc/donate/fail?tran_id=${tranId}`);
});

const handleCancel = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;

  try {
    await FundDonationService.handleFailedPayment(payload, PaymentStatus.CANCELLED);
  } catch (err: any) {
    console.error('Donation payment cancel error:', err?.message);
  }

  return res.redirect(`${config.client_url}/rudc/donate/cancel?tran_id=${tranId}`);
});

const handleIPN = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  let result;
  if (payload.status === 'VALID' || payload.status === 'VALIDATED') {
    result = await FundDonationService.validatePaymentAndComplete(payload);
  } else {
    result = await FundDonationService.handleFailedPayment(payload);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'IPN notification processed successfully!',
    data: result,
  });
});

const createManualDonation = catchAsync(async (req: Request, res: Response) => {
  const actingUserId = req.user?.userId || req.user?.id ? Number(req.user?.userId || req.user?.id) : undefined;
  const result = await FundDonationService.createManualDonation(req.body, actingUserId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Manual offline donation recorded successfully!',
    data: result,
  });
});

const getAllDonations = catchAsync(async (req: Request, res: Response) => {
  const result = await FundDonationService.getAllDonations(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fund donations retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getDonationById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await FundDonationService.getDonationById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation details retrieved successfully!',
    data: result,
  });
});

const getDonationByReceipt = catchAsync(async (req: Request, res: Response) => {
  const identifier = Array.isArray(req.params.identifier)
    ? req.params.identifier[0]
    : req.params.identifier;
  const result = await FundDonationService.getDonationByReceiptOrTranId(identifier);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation receipt retrieved successfully!',
    data: result,
  });
});

const updateDonation = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await FundDonationService.updateDonation(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation updated successfully!',
    data: result,
  });
});

const deleteDonation = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await FundDonationService.deleteDonation(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation deleted successfully!',
    data: result,
  });
});

const getDonationStats = catchAsync(async (req: Request, res: Response) => {
  const result = await FundDonationService.getDonationStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Donation statistics retrieved successfully!',
    data: result,
  });
});

const getPublicCampaigns = catchAsync(async (req: Request, res: Response) => {
  const result = await FundDonationService.getPublicCampaigns();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Public fundraiser campaigns retrieved successfully!',
    data: result,
  });
});

const getPublicRecentDonors = catchAsync(async (req: Request, res: Response) => {
  const result = await FundDonationService.getPublicRecentDonors();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recent public donors retrieved successfully!',
    data: result,
  });
});

export const FundDonationController = {
  initiateDonation,
  handleSuccess,
  handleFail,
  handleCancel,
  handleIPN,
  createManualDonation,
  getAllDonations,
  getDonationById,
  getDonationByReceipt,
  updateDonation,
  deleteDonation,
  getDonationStats,
  getPublicCampaigns,
  getPublicRecentDonors,
};

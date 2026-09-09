import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

const initiateMembershipPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const result = await PaymentService.initiateMembershipPayment(userId, req.body?.amount);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment session initiated successfully!',
    data: result,
  });
});

const handleSuccess = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  const result = await PaymentService.validatePaymentAndActivate(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment verified and membership activated successfully!',
    data: result,
  });
});

const handleFail = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  const result = await PaymentService.handleFailedPayment(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: false,
    message: 'Payment transaction failed or was rejected.',
    data: result,
  });
});

const handleCancel = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  const result = await PaymentService.handleFailedPayment(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: false,
    message: 'Payment transaction was cancelled by user.',
    data: result,
  });
});

const handleIPN = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body };
  let result;
  if (payload.status === 'VALID' || payload.status === 'VALIDATED') {
    result = await PaymentService.validatePaymentAndActivate(payload);
  } else {
    result = await PaymentService.handleFailedPayment(payload);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'IPN callback processed successfully!',
    data: result,
  });
});

export const PaymentController = {
  initiateMembershipPayment,
  handleSuccess,
  handleFail,
  handleCancel,
  handleIPN,
};

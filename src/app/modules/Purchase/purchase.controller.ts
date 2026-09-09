import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PurchaseService } from './purchase.service';

const createGuestPurchase = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.createGuestPurchaseInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Guest purchase completed successfully!',
    data: result,
  });
});

const createMemberPurchase = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  const result = await PurchaseService.createMemberPurchaseInDB(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Member purchase completed successfully!',
    data: result,
  });
});

const getMyPurchases = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user?.userId || req.user?.id);
  // Always scope to the requesting user's ID regardless of role
  const scopedQuery = { ...req.query, userId: String(userId) };
  const result = await PurchaseService.getAllPurchasesFromDB(scopedQuery, {
    userId,
    role: 'MEMBER', // Force member-style filtering (by userId)
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My purchase history retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getAllPurchases = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
    ? {
        userId: Number(req.user?.userId || req.user?.id),
        role: req.user?.role as string,
      }
    : undefined;
  const result = await PurchaseService.getAllPurchasesFromDB(req.query, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All purchase records retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getGuestOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.getGuestOrdersFromDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guest purchase orders retrieved successfully!',
    data: result,
  });
});

const trackGuestOrder = catchAsync(async (req: Request, res: Response) => {
  const transactionId = String(req.params.transactionId || '');
  const email = req.query.email as string | undefined;
  const result = await PurchaseService.trackGuestOrderByTxnIdFromDB(transactionId, email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order tracking details retrieved successfully!',
    data: result,
  });
});

const cancelGuestPurchase = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.cancelGuestPurchaseInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Guest purchase cancelled successfully and stock restored!',
    data: result,
  });
});

const cancelMemberPurchase = catchAsync(async (req: Request, res: Response) => {
  const purchaseId = Number(req.params.id);
  const userId = Number(req.user?.userId || req.user?.id);
  const userRole = req.user?.role as string;
  const { reason } = req.body || {};

  const result = await PurchaseService.cancelMemberPurchaseInDB(purchaseId, userId, userRole, reason);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase cancelled successfully and stock restored!',
    data: result,
  });
});

const updatePurchaseStatus = catchAsync(async (req: Request, res: Response) => {
  const purchaseId = Number(req.params.id);
  const result = await PurchaseService.updatePurchaseStatusInDB(purchaseId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase status updated successfully!',
    data: result,
  });
});

const createPOSSale = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await PurchaseService.createPOSSaleInDB(req.body, shifterId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Counter desk POS sale recorded and completed successfully!',
    data: result,
  });
});

const deletePurchase = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PurchaseService.deletePurchaseInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase order deleted successfully!',
    data: result,
  });
});

export const PurchaseController = {
  createGuestPurchase,
  createMemberPurchase,
  createPOSSale,
  getMyPurchases,
  getAllPurchases,
  getGuestOrders,
  trackGuestOrder,
  cancelGuestPurchase,
  cancelMemberPurchase,
  updatePurchaseStatus,
  deletePurchase,
};


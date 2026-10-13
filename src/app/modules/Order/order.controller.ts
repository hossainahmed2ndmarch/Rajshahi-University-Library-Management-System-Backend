import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderService } from './order.service';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user ? Number((req.user as any).userId) : undefined;
  const result = await OrderService.createOrderInDB(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order placed successfully!',
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrdersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderService.getOrderByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully!',
    data: result,
  });
});

const trackOrderByCode = catchAsync(async (req: Request, res: Response) => {
  const { orderCode } = req.params;
  const result = await OrderService.trackOrderByCodeFromDB(String(orderCode));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order tracking details retrieved successfully!',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = Number((req.user as any).userId);
  const result = await OrderService.getMyOrdersFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Personal orders retrieved successfully!',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderService.updateOrderStatusInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order status updated successfully!',
    data: result,
  });
});

const verifyOrderPayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderService.verifyPaymentInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment verification recorded successfully!',
    data: result,
  });
});

const dispatchCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderService.dispatchCourierInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Consignment booked with courier & OTP dispatched!',
    data: result,
  });
});

const verifyDeliveryOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp, orderId, trackingNumber } = req.body;
  const paramId = req.params.id ? Number(req.params.id) : undefined;

  const result = await OrderService.verifyDeliveryOtpInDB(
    { orderId: paramId || (orderId ? Number(orderId) : undefined), trackingNumber },
    otp
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Delivery OTP confirmed! Parcel marked as DELIVERED.',
    data: result,
  });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user ? Number((req.user as any).userId) : undefined;
  const userRole = req.user ? (req.user as any).role : undefined;
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(userRole);

  const result = await OrderService.cancelOrderInDB(Number(id), userId, isStaff);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order cancelled and stock inventory restored!',
    data: result,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await OrderService.deleteOrderInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order record deleted successfully!',
    data: null,
  });
});

export const OrderController = {
  createOrder,
  getAllOrders,
  getOrderById,
  trackOrderByCode,
  getMyOrders,
  updateOrderStatus,
  verifyOrderPayment,
  dispatchCourier,
  verifyDeliveryOtp,
  cancelOrder,
  deleteOrder,
};

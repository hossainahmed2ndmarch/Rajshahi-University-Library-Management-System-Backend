import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { OrderService } from '../Order/order.service';

export const PurchaseService = {
  createGuestPurchaseInDB: async (_payload: any) => {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Guest checkout is no longer supported. Please register or sign in to complete your purchase.'
    );
  },
  createMemberPurchaseInDB: OrderService.createOrderInDB,
  getAllPurchasesFromDB: OrderService.getAllOrdersFromDB,
  getPurchaseByIdFromDB: OrderService.getOrderByIdFromDB,
  getMyPurchasesFromDB: OrderService.getMyOrdersFromDB,
  updateOrderStatusInDB: OrderService.updateOrderStatusInDB,
  verifyPaymentInDB: OrderService.verifyPaymentInDB,
  dispatchCourierInDB: OrderService.dispatchCourierInDB,
  verifyDeliveryOtpInDB: OrderService.verifyDeliveryOtpInDB,
  cancelPurchaseInDB: OrderService.cancelOrderInDB,
  deletePurchaseFromDB: OrderService.deleteOrderInDB,
  trackOrderByCodeFromDB: OrderService.trackOrderByCodeFromDB,
};

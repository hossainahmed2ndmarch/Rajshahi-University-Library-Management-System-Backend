import httpStatus from 'http-status';
import { OrderStatus, PaymentMethod, PaymentStatus, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import sslcommerz from '../../../lib/sslcommerz';
import { TSSLCommerzIPN } from './payment.interface';

const initiateMembershipPayment = async (userId: number, amount?: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const membershipAmount = amount || 500;
  const tran_id = `MEM-${user.id}-${Date.now()}`;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';

  const sslPayload = {
    total_amount: membershipAmount,
    tran_id,
    success_url: `${baseUrl}/payments/success`,
    fail_url: `${baseUrl}/payments/fail`,
    cancel_url: `${baseUrl}/payments/cancel`,
    ipn_url: `${baseUrl}/payments/ipn`,
    cus_name: user.name,
    cus_email: user.email,
    cus_phone: user.phone,
    cus_add1: user.institution || 'Rajshahi University',
    product_name: 'RUIL Library Membership Subscription',
    product_category: 'Membership',
    value_a: user.id.toString(),
    value_b: 'MEMBERSHIP',
  };

  const sslResponse = await sslcommerz.init(sslPayload);

  if (sslResponse.status !== 'SUCCESS' || !sslResponse.GatewayPageURL) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      sslResponse.failedreason || 'SSLCommerz payment gateway initialization failed!'
    );
  }

  return {
    paymentUrl: sslResponse.GatewayPageURL,
    transactionId: tran_id,
  };
};

const validatePaymentAndActivate = async (payload: TSSLCommerzIPN) => {
  const val_id = payload.val_id;
  const tran_id = payload.tran_id;

  if (val_id) {
    const validation = await sslcommerz.validate(val_id);
    if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
      throw new AppError(httpStatus.BAD_REQUEST, 'Transaction validation failed with SSLCommerz!');
    }
  } else if (payload.status !== 'VALID' && payload.status !== 'VALIDATED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment was not marked as valid by gateway!');
  }

  // Handle membership payment transaction
  const isMembership = payload.value_b === 'MEMBERSHIP' || (tran_id && tran_id.startsWith('MEM-'));
  const userId = payload.value_a
    ? Number(payload.value_a)
    : tran_id && tran_id.startsWith('MEM-')
    ? Number(tran_id.split('-')[1])
    : null;

  if (isMembership && userId) {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const paidAmount = payload.amount ? Number(payload.amount) : 500;

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ACTIVE,
          isPaid: true,
          paymentMethod: PaymentMethod.ONLINE,
          membershipStartedAt: now,
          membershipExpiresAt: expiresAt,
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          isPaid: true,
          paymentMethod: true,
          membershipStartedAt: true,
          membershipExpiresAt: true,
        },
      });

      const paymentRecord = await tx.payment.create({
        data: {
          transactionId: tran_id || `ONLINE-MEM-${userId}-${now.getTime()}`,
          userId,
          amount: paidAmount,
          paymentMethod: PaymentMethod.ONLINE,
          status: PaymentStatus.COMPLETED,
          paidAt: now,
        },
      });

      return { user: updatedUser, payment: paymentRecord };
    });

    return {
      type: 'MEMBERSHIP',
      user: result.user,
      payment: result.payment,
      message: 'Membership activated successfully for 1 year!',
    };
  }

  // Handle purchase order transaction
  if (tran_id && tran_id.startsWith('TXN-')) {
    const updatedPurchase = await prisma.purchase.update({
      where: { transactionId: tran_id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PROCESSING,
      },
      include: {
        book: true,
      },
    });

    return {
      type: 'PURCHASE',
      purchase: updatedPurchase,
      message: 'Purchase payment completed successfully!',
    };
  }

  return {
    message: 'Payment validated successfully!',
    tran_id,
  };
};

const handleFailedPayment = async (payload: TSSLCommerzIPN) => {
  const tran_id = payload.tran_id;

  if (tran_id && tran_id.startsWith('TXN-')) {
    const existing = await prisma.purchase.findUnique({
      where: { transactionId: tran_id },
    });

    if (existing) {
      const updatedPurchase = await prisma.purchase.update({
        where: { transactionId: tran_id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          orderStatus: OrderStatus.CANCELLED,
        },
      });

      return {
        type: 'PURCHASE',
        purchase: updatedPurchase,
        message: 'Purchase payment failed and order was cancelled.',
      };
    }
  }

  return {
    message: 'Payment transaction failed or was cancelled.',
    tran_id,
  };
};

export const PaymentService = {
  initiateMembershipPayment,
  validatePaymentAndActivate,
  handleFailedPayment,
};

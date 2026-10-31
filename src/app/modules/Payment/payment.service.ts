import httpStatus from 'http-status';
import { OrderStatus, PaymentMethod, PaymentStatus, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import sslcommerz from '../../../lib/sslcommerz';
import { TSSLCommerzIPN } from './payment.interface';

const initiateMembershipPayment = async (userId: string, amount?: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { academicProfile: true },
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
    cus_add1: user.academicProfile?.institution || 'Rajshahi University',
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

  // ─── Idempotency guard ────────────────────────────────────────────────────
  // SSLCommerz can fire both the success redirect AND the IPN webhook for the
  // same transaction. If we've already recorded a COMPLETED payment for this
  // tran_id, return the existing record immediately to avoid duplicate
  // membership activations or purchase status flips.
  if (tran_id) {
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: tran_id },
    });
    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      return {
        type: 'ALREADY_PROCESSED',
        message: 'Payment was already processed successfully.',
        payment: existingPayment,
      };
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (val_id) {
    const validation = await sslcommerz.validate(val_id);
    if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
      throw new AppError(httpStatus.BAD_REQUEST, 'Transaction validation failed with SSLCommerz!');
    }
  } else if (payload.status !== 'VALID' && payload.status !== 'VALIDATED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment was not marked as valid by gateway!');
  }

  // Handle membership payment transaction
  // tran_id format: MEM-<userId>-<timestamp>
  const isMembership = payload.value_b === 'MEMBERSHIP' || (tran_id && tran_id.startsWith('MEM-'));
  const userId: string | null = payload.value_a
    ? String(payload.value_a)
    : tran_id && tran_id.startsWith('MEM-')
    ? tran_id.split('-')[1] // e.g. "MEM-clxxx123-1234567890" → "clxxx123"
    : null;

  if (isMembership && userId) {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const paidAmount = payload.amount ? Number(payload.amount) : 500;

    // Wrap in a serializable transaction so that concurrent webhook deliveries
    // cannot both execute the user-update + payment-create pair.
    const result = await prisma.$transaction(
      async (tx) => {
        // Re-check idempotency inside the transaction (handles concurrent webhooks)
        const existingInTx = tran_id
          ? await tx.payment.findUnique({ where: { transactionId: tran_id } })
          : null;

        if (existingInTx && existingInTx.status === PaymentStatus.COMPLETED) {
          return { alreadyProcessed: true, payment: existingInTx };
        }

        // Activate the user account status
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            status: UserStatus.ACTIVE,
          },
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        });

        // Update the RuilMemberProfile with payment details
        await tx.ruilMemberProfile.upsert({
          where: { userId },
          create: {
            userId,
            isPaid: true,
            paymentMethod: PaymentMethod.ONLINE,
            membershipStartedAt: now,
            membershipExpiresAt: expiresAt,
            membershipStatus: UserStatus.ACTIVE,
          },
          update: {
            isPaid: true,
            paymentMethod: PaymentMethod.ONLINE,
            membershipStartedAt: now,
            membershipExpiresAt: expiresAt,
            membershipStatus: UserStatus.ACTIVE,
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

        return { alreadyProcessed: false, user: updatedUser, payment: paymentRecord };
      },
      { isolationLevel: 'Serializable' }
    );

    if (result.alreadyProcessed) {
      return {
        type: 'ALREADY_PROCESSED',
        message: 'Payment was already processed successfully.',
        payment: result.payment,
      };
    }

    return {
      type: 'MEMBERSHIP',
      user: result.user,
      payment: result.payment,
      message: 'Membership activated successfully for 1 year!',
    };
  }

  // Handle purchase/order transaction (tran_id starts with 'TXN-' or 'ORD-')
  if (tran_id && (tran_id.startsWith('TXN-') || tran_id.startsWith('ORD-'))) {
    // Idempotency: if already PAID, skip re-processing
    const existingOrder = await prisma.order.findFirst({
      where: { transactionId: tran_id },
      include: { items: { include: { book: true } } },
    });

    if (!existingOrder) {
      return { message: 'Order not found for this transaction.', tran_id };
    }

    if (existingOrder.paymentStatus === PaymentStatus.PAID) {
      return {
        type: 'ALREADY_PROCESSED',
        order: existingOrder,
        message: 'Order payment was already marked as paid.',
      };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PROCESSING,
      },
      include: {
        items: { include: { book: true } },
      },
    });

    return {
      type: 'ORDER',
      order: updatedOrder,
      message: 'Order payment completed successfully!',
    };
  }

  return {
    message: 'Payment validated successfully!',
    tran_id,
  };
};

const handleFailedPayment = async (payload: TSSLCommerzIPN) => {
  const tran_id = payload.tran_id;

  if (tran_id && (tran_id.startsWith('TXN-') || tran_id.startsWith('ORD-'))) {
    const existing = await prisma.order.findFirst({
      where: { transactionId: tran_id },
    });

    if (existing) {
      const updatedOrder = await prisma.order.update({
        where: { id: existing.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          orderStatus: OrderStatus.CANCELLED,
        },
      });

      return {
        type: 'ORDER',
        order: updatedOrder,
        message: 'Order payment failed and order was cancelled.',
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

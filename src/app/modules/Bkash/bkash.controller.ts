import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import {
  BKASH_PERSONAL_ACCOUNT,
  createBkashPayment,
  executeBkashPayment,
  isBkashMerchantConfigured,
  queryBkashPayment,
} from '../../../lib/bkash';
import { PaymentStatus, OrderStatus, UserStatus } from '@prisma/client';
import { emitOrderStatusUpdate } from '../../../lib/socket';

const getBkashInfo = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash information retrieved successfully!',
    data: {
      personalNumber: BKASH_PERSONAL_ACCOUNT, // 01601704112
      formattedPersonalNumber: '+880 1601-704112',
      isMerchantConfigured: isBkashMerchantConfigured(),
      instructions: [
        `Go to your bKash App or dial *247#`,
        `Select 'Send Money' option`,
        `Enter recipient number: ${BKASH_PERSONAL_ACCOUNT}`,
        `Enter the exact payable amount`,
        `Use your Order / Member Reference as reference note`,
        `Complete payment and copy the TrxID (Transaction ID)`,
        `Enter your Sender Phone number & TrxID on the checkout/payment page`,
      ],
    },
  });
});

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const { purpose, referenceId, amount, callbackUrl, payerReference } = req.body;

  if (!purpose || !amount) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment purpose and amount are required!');
  }

  const invoiceNumber = `${purpose}-${referenceId || Date.now()}`;

  const result = await createBkashPayment({
    amount: Number(amount),
    invoiceNumber,
    payerReference: payerReference || 'RUIL',
    callbackUrl,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash payment session initialized successfully!',
    data: result,
  });
});

const completePayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentID, purpose, referenceId } = req.body;

  if (!paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, 'paymentID is required to execute payment!');
  }

  const result = await executeBkashPayment(paymentID);

  if (result.statusCode !== '0000' || result.transactionStatus !== 'Completed') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      result.statusMessage || 'bKash payment execution was not successful!'
    );
  }

  const trxID = result.trxID || `TRX_${Date.now()}`;

  // Automatically update the matching business model
  if (purpose === 'ORDER' && referenceId) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: Number(referenceId) || 0 }, { orderCode: String(referenceId) }],
      },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentVerified: true,
          verifiedAt: new Date(),
          customerTrxId: trxID,
          orderStatus: OrderStatus.PROCESSING,
        },
      });

      emitOrderStatusUpdate(order.orderCode, {
        orderStatus: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        paymentVerified: true,
      });
    }
  } else if (purpose === 'MEMBERSHIP' && referenceId) {
    const user = await prisma.user.findUnique({
      where: { id: Number(referenceId) },
    });

    if (user) {
      const now = new Date();
      const expires = new Date(now);
      expires.setFullYear(expires.getFullYear() + 1);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            status: UserStatus.ACTIVE,
            isPaid: true,
            membershipStartedAt: now,
            membershipExpiresAt: expires,
          },
        }),
        prisma.payment.create({
          data: {
            transactionId: trxID,
            userId: user.id,
            amount: Number(result.amount) || 500,
            paymentMethod: 'BKASH',
            status: PaymentStatus.COMPLETED,
            paidAt: now,
            customerTrxId: trxID,
          },
        }),
      ]);
    }
  } else if (purpose === 'IYANOT' && referenceId) {
    await prisma.rudcIyanot.update({
      where: { id: Number(referenceId) },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        transactionId: trxID,
      },
    });
  } else if (purpose === 'DONATION' && referenceId) {
    await prisma.fundDonation.update({
      where: { id: Number(referenceId) },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
        receiptNo: trxID,
      },
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash payment executed and registered successfully!',
    data: {
      ...result,
      trxID,
    },
  });
});

const submitPersonalPayment = catchAsync(async (req: Request, res: Response) => {
  const { purpose, referenceId, senderPhone, trxID, amount } = req.body;

  if (!purpose || !senderPhone || !trxID) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Purpose, senderPhone, and trxID are required!');
  }

  const cleanTrxID = String(trxID).trim().toUpperCase();
  const cleanPhone = String(senderPhone).trim();
  const roundAmount = Math.round(Number(amount) || 0);

  let updatedRecord: any = null;

  if (purpose === 'ORDER' && referenceId) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: Number(referenceId) || 0 }, { orderCode: String(referenceId) }],
      },
    });

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
    }

    updatedRecord = await prisma.order.update({
      where: { id: order.id },
      data: {
        mfsProvider: 'BKASH',
        senderPhone: cleanPhone,
        customerTrxId: cleanTrxID,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    emitOrderStatusUpdate(order.orderCode, {
      paymentStatus: PaymentStatus.PENDING,
      customerTrxId: cleanTrxID,
    });
  } else if (purpose === 'MEMBERSHIP' && referenceId) {
    const user = await prisma.user.findUnique({
      where: { id: Number(referenceId) },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'Member not found!');
    }

    const txnId = `BKASH-${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        transactionId: txnId,
        userId: user.id,
        amount: roundAmount || 500,
        paymentMethod: 'BKASH',
        mfsProvider: 'BKASH',
        senderPhone: cleanPhone,
        customerTrxId: cleanTrxID,
        status: PaymentStatus.PENDING,
      },
    });

    updatedRecord = { user, payment };
  } else if (purpose === 'IYANOT' && referenceId) {
    const iyanot = await prisma.rudcIyanot.findUnique({
      where: { id: Number(referenceId) },
    });

    if (!iyanot) {
      throw new AppError(httpStatus.NOT_FOUND, 'Iyanot record not found!');
    }

    updatedRecord = await prisma.rudcIyanot.update({
      where: { id: iyanot.id },
      data: {
        paymentMethod: 'ONLINE',
        transactionId: cleanTrxID,
        status: 'PENDING',
      },
    });
  } else if (purpose === 'DONATION' && referenceId) {
    const donation = await prisma.fundDonation.findUnique({
      where: { id: Number(referenceId) },
    });

    if (!donation) {
      throw new AppError(httpStatus.NOT_FOUND, 'Donation record not found!');
    }

    updatedRecord = await prisma.fundDonation.update({
      where: { id: donation.id },
      data: {
        paymentMethod: 'BKASH',
        receiptNo: cleanTrxID,
        donorPhone: cleanPhone,
        paymentStatus: PaymentStatus.PENDING,
      },
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Personal bKash transaction submitted for verification!',
    data: {
      purpose,
      referenceId,
      senderPhone: cleanPhone,
      trxID: cleanTrxID,
      amount: roundAmount,
      record: updatedRecord,
    },
  });
});

export const BkashController = {
  getBkashInfo,
  initiatePayment,
  completePayment,
  submitPersonalPayment,
};

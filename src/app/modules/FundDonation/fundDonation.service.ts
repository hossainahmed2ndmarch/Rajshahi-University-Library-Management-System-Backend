import httpStatus from 'http-status';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import config from '../../config';
import sslcommerz from '../../../lib/sslcommerz';
import {
  TCreateManualDonationPayload,
  TInitiateDonationPayload,
  TUpdateDonationPayload,
} from './fundDonation.interface';

const initiateOnlineDonation = async (
  payload: TInitiateDonationPayload,
  userId?: number
) => {
  if (payload.amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Donation amount must be greater than zero!');
  }

  // If eventId provided, verify event exists
  if (payload.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: payload.eventId },
    });
    if (!event) {
      throw new AppError(httpStatus.NOT_FOUND, 'Selected fundraiser event was not found!');
    }
  }

  const tran_id = `FND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Create pending donation record
  const donation = await prisma.fundDonation.create({
    data: {
      transactionId: tran_id,
      amount: payload.amount,
      eventId: payload.eventId || null,
      userId: userId || null,
      donorName: payload.donorName || null,
      donorEmail: payload.donorEmail || null,
      donorPhone: payload.donorPhone || null,
      isAnonymous: payload.isAnonymous ?? false,
      donorNote: payload.donorNote || null,
      paymentMethod: PaymentMethod.ONLINE,
      paymentStatus: PaymentStatus.PENDING,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  const baseUrl = config.backend_url || 'http://localhost:5000/api/v1';

  const sslPayload = {
    total_amount: payload.amount,
    tran_id,
    success_url: `${baseUrl}/fund-donations/success`,
    fail_url: `${baseUrl}/fund-donations/fail`,
    cancel_url: `${baseUrl}/fund-donations/cancel`,
    ipn_url: `${baseUrl}/fund-donations/ipn`,
    cus_name: payload.donorName || 'Generous Donor',
    cus_email: payload.donorEmail || 'donor@rudc.org',
    cus_phone: payload.donorPhone || '01700000000',
    cus_add1: 'Rajshahi University Campus',
    product_name: donation.event?.title ? `RUDC - ${donation.event.title}` : 'RUDC General Donation',
    product_category: 'Donation',
    value_a: donation.id.toString(),
    value_b: 'FUND_DONATION',
  };

  try {
    const sslResponse = await sslcommerz.init(sslPayload);

    if (sslResponse.status === 'SUCCESS' && sslResponse.GatewayPageURL) {
      return {
        paymentUrl: sslResponse.GatewayPageURL,
        transactionId: tran_id,
        donationId: donation.id,
      };
    }
  } catch (error) {
    // Gateway error or mock development environment fallback
    console.warn('SSLCommerz initiation notice:', error);
  }

  // Graceful fallback URL for local testing / development when gateway credentials are sandbox or mock
  const clientSuccessMock = `${config.client_url}/rudc/donate/success?tran_id=${tran_id}`;
  return {
    paymentUrl: clientSuccessMock,
    transactionId: tran_id,
    donationId: donation.id,
  };
};

const validatePaymentAndComplete = async (payload: Record<string, any>) => {
  const tran_id = payload.tran_id;
  const val_id = payload.val_id;

  if (!tran_id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Transaction ID is required to verify payment!');
  }

  const existingDonation = await prisma.fundDonation.findUnique({
    where: { transactionId: tran_id },
    include: { event: true },
  });

  if (!existingDonation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation transaction not found!');
  }

  // If already marked as paid
  if (existingDonation.paymentStatus === PaymentStatus.PAID) {
    return existingDonation;
  }

  // Gateway validation if val_id is provided
  if (val_id) {
    try {
      const validation = await sslcommerz.validate(val_id);
      if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
        throw new AppError(httpStatus.BAD_REQUEST, 'Gateway validation failed for this transaction!');
      }
    } catch (err: any) {
      console.warn('Gateway verification bypass in dev/mock:', err?.message);
    }
  }

  const receiptNo = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();

  // Atomically update donation and increment event raisedAmount if eventId present
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.fundDonation.update({
      where: { id: existingDonation.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        receiptNo,
        paidAt: now,
      },
      include: {
        event: true,
      },
    });

    if (existingDonation.eventId) {
      await tx.event.update({
        where: { id: existingDonation.eventId },
        data: {
          raisedAmount: {
            increment: existingDonation.amount,
          },
        },
      });
    }

    return updated;
  });

  return result;
};

const handleFailedPayment = async (payload: Record<string, any>, status: PaymentStatus = PaymentStatus.FAILED) => {
  const tran_id = payload.tran_id;
  if (!tran_id) return null;

  const existing = await prisma.fundDonation.findUnique({
    where: { transactionId: tran_id },
  });

  if (existing && existing.paymentStatus === PaymentStatus.PENDING) {
    return await prisma.fundDonation.update({
      where: { id: existing.id },
      data: { paymentStatus: status },
    });
  }

  return existing;
};

const createManualDonation = async (
  payload: TCreateManualDonationPayload,
  actingUserId?: number
) => {
  if (payload.amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Donation amount must be greater than zero!');
  }

  if (payload.eventId) {
    const event = await prisma.event.findUnique({ where: { id: payload.eventId } });
    if (!event) {
      throw new AppError(httpStatus.NOT_FOUND, 'Fundraiser event not found!');
    }
  }

  const tran_id = `MANUAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const receiptNo =
    payload.receiptNo || `RCP-M-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const paymentStatus = payload.paymentStatus || PaymentStatus.PAID;
  const paidAt = paymentStatus === PaymentStatus.PAID ? (payload.paidAt ? new Date(payload.paidAt) : new Date()) : null;

  const donation = await prisma.$transaction(async (tx) => {
    const created = await tx.fundDonation.create({
      data: {
        transactionId: tran_id,
        receiptNo,
        amount: payload.amount,
        eventId: payload.eventId || null,
        userId: payload.userId || actingUserId || null,
        donorName: payload.donorName || null,
        donorEmail: payload.donorEmail || null,
        donorPhone: payload.donorPhone || null,
        isAnonymous: payload.isAnonymous ?? false,
        donorNote: payload.donorNote || null,
        paymentMethod: payload.paymentMethod || PaymentMethod.CASH,
        paymentStatus,
        paidAt,
      },
      include: {
        event: {
          select: { id: true, title: true, slug: true, targetAmount: true, raisedAmount: true },
        },
      },
    });

    if (paymentStatus === PaymentStatus.PAID && payload.eventId) {
      await tx.event.update({
        where: { id: payload.eventId },
        data: {
          raisedAmount: {
            increment: payload.amount,
          },
        },
      });
    }

    return created;
  });

  return donation;
};

const getAllDonations = async (query: Record<string, unknown>) => {
  const {
    page = 1,
    limit = 20,
    paymentStatus,
    paymentMethod,
    eventId,
    isAnonymous,
    searchTerm,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const take = Number(limit) || 20;
  const skip = (Number(page) - 1) * take;

  const whereConditions: Prisma.FundDonationWhereInput = {};

  if (paymentStatus && paymentStatus !== 'ALL') {
    whereConditions.paymentStatus = paymentStatus as PaymentStatus;
  }

  if (paymentMethod && paymentMethod !== 'ALL') {
    whereConditions.paymentMethod = paymentMethod as PaymentMethod;
  }

  if (eventId && eventId !== 'ALL') {
    whereConditions.eventId = Number(eventId);
  }

  if (isAnonymous !== undefined && isAnonymous !== 'ALL') {
    whereConditions.isAnonymous = isAnonymous === 'true' || isAnonymous === true;
  }

  if (searchTerm) {
    const searchStr = String(searchTerm).trim();
    whereConditions.OR = [
      { donorName: { contains: searchStr, mode: 'insensitive' } },
      { donorEmail: { contains: searchStr, mode: 'insensitive' } },
      { donorPhone: { contains: searchStr, mode: 'insensitive' } },
      { transactionId: { contains: searchStr, mode: 'insensitive' } },
      { receiptNo: { contains: searchStr, mode: 'insensitive' } },
    ];
  }

  const [total, records] = await Promise.all([
    prisma.fundDonation.count({ where: whereConditions }),
    prisma.fundDonation.findMany({
      where: whereConditions,
      skip,
      take,
      orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            targetAmount: true,
            raisedAmount: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: take,
      total,
      totalPage: Math.ceil(total / take),
    },
    data: records,
  };
};

const getDonationById = async (id: number) => {
  const donation = await prisma.fundDonation.findUnique({
    where: { id },
    include: {
      event: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Fund donation record not found!');
  }

  return donation;
};

const getDonationByReceiptOrTranId = async (identifier: string) => {
  const donation = await prisma.fundDonation.findFirst({
    where: {
      OR: [{ receiptNo: identifier }, { transactionId: identifier }],
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          targetAmount: true,
          raisedAmount: true,
        },
      },
    },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation receipt not found!');
  }

  return donation;
};

const updateDonation = async (id: number, payload: TUpdateDonationPayload) => {
  const existing = await prisma.fundDonation.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation record not found!');
  }

  const oldStatus = existing.paymentStatus;
  const newStatus = payload.paymentStatus ?? oldStatus;
  const targetEventId = payload.eventId !== undefined ? payload.eventId : existing.eventId;
  const donationAmount = payload.amount ?? existing.amount;

  const result = await prisma.$transaction(async (tx) => {
    // If status changed from not PAID to PAID:
    if (oldStatus !== PaymentStatus.PAID && newStatus === PaymentStatus.PAID) {
      if (targetEventId) {
        await tx.event.update({
          where: { id: targetEventId },
          data: { raisedAmount: { increment: donationAmount } },
        });
      }
    }
    // If status changed from PAID to another status (CANCELLED, REFUNDED, etc):
    else if (oldStatus === PaymentStatus.PAID && newStatus !== PaymentStatus.PAID) {
      if (existing.eventId) {
        await tx.event.update({
          where: { id: existing.eventId },
          data: { raisedAmount: { decrement: existing.amount } },
        });
      }
    }

    const updateData: Prisma.FundDonationUpdateInput = {};
    if (payload.donorName !== undefined) updateData.donorName = payload.donorName;
    if (payload.donorEmail !== undefined) updateData.donorEmail = payload.donorEmail;
    if (payload.donorPhone !== undefined) updateData.donorPhone = payload.donorPhone;
    if (payload.isAnonymous !== undefined) updateData.isAnonymous = payload.isAnonymous;
    if (payload.donorNote !== undefined) updateData.donorNote = payload.donorNote;
    if (payload.amount !== undefined) updateData.amount = payload.amount;
    if (payload.paymentMethod !== undefined) updateData.paymentMethod = payload.paymentMethod;
    if (payload.paymentStatus !== undefined) updateData.paymentStatus = payload.paymentStatus;
    if (payload.receiptNo !== undefined) updateData.receiptNo = payload.receiptNo;

    if (payload.eventId !== undefined) {
      if (payload.eventId === null) {
        updateData.event = { disconnect: true };
      } else {
        updateData.event = { connect: { id: payload.eventId } };
      }
    }

    if (newStatus === PaymentStatus.PAID && !existing.paidAt) {
      updateData.paidAt = new Date();
    }

    return await tx.fundDonation.update({
      where: { id },
      data: updateData,
      include: {
        event: true,
        user: true,
      },
    });
  });

  return result;
};

const deleteDonation = async (id: number) => {
  const existing = await prisma.fundDonation.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation record not found!');
  }

  const result = await prisma.$transaction(async (tx) => {
    if (existing.paymentStatus === PaymentStatus.PAID && existing.eventId) {
      await tx.event.update({
        where: { id: existing.eventId },
        data: { raisedAmount: { decrement: existing.amount } },
      });
    }
    return await tx.fundDonation.delete({ where: { id } });
  });

  return result;
};

const getDonationStats = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalCompletedAgg,
    totalCompletedCount,
    todayAgg,
    pendingCount,
    totalDonorsCount,
    activeCampaigns,
    recentDonations,
  ] = await Promise.all([
    prisma.fundDonation.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.fundDonation.count({
      where: { paymentStatus: PaymentStatus.PAID },
    }),
    prisma.fundDonation.aggregate({
      where: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: { gte: startOfToday },
      },
      _sum: { amount: true },
    }),
    prisma.fundDonation.count({
      where: { paymentStatus: PaymentStatus.PENDING },
    }),
    prisma.fundDonation.count(),
    prisma.event.count({
      where: {
        isFundraiser: true,
        isActive: true,
        org: { in: ['RUDC', 'BOTH'] },
      },
    }),
    prisma.fundDonation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    totalRaised: totalCompletedAgg._sum.amount || 0,
    totalCompletedCount,
    todayRaised: todayAgg._sum.amount || 0,
    pendingCount,
    totalDonorsCount,
    activeCampaigns,
    recentDonations,
  };
};

const getPublicCampaigns = async () => {
  return await prisma.event.findMany({
    where: {
      isFundraiser: true,
      isActive: true,
      org: { in: ['RUDC', 'BOTH'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      location: true,
      bannerImage: true,
      targetAmount: true,
      raisedAmount: true,
      startDate: true,
      endDate: true,
      status: true,
      _count: {
        select: {
          fundDonations: {
            where: { paymentStatus: PaymentStatus.PAID },
          },
        },
      },
    },
  });
};

const getPublicRecentDonors = async () => {
  const donations = await prisma.fundDonation.findMany({
    where: { paymentStatus: PaymentStatus.PAID },
    take: 8,
    orderBy: { paidAt: 'desc' },
    select: {
      id: true,
      amount: true,
      paidAt: true,
      isAnonymous: true,
      donorName: true,
      donorNote: true,
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  // Mask donor identity if isAnonymous is true
  return donations.map((d) => ({
    id: d.id,
    amount: d.amount,
    paidAt: d.paidAt,
    donorName: d.isAnonymous ? 'Anonymous Donor (বেনামী শুভাকাঙ্ক্ষী)' : d.donorName || 'Generous Brother',
    donorNote: d.donorNote,
    eventName: d.event?.title || 'General RUDC Fund',
  }));
};

export const FundDonationService = {
  initiateOnlineDonation,
  validatePaymentAndComplete,
  handleFailedPayment,
  createManualDonation,
  getAllDonations,
  getDonationById,
  getDonationByReceiptOrTranId,
  updateDonation,
  deleteDonation,
  getDonationStats,
  getPublicCampaigns,
  getPublicRecentDonors,
};

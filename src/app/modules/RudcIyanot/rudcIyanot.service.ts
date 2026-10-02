import httpStatus from 'http-status';
import { IyanotPaymentMethod, IyanotStatus, UserRole } from '@prisma/client';
import prisma from '../../../lib/db';
import AppError from '../../errors/AppError';
import { TRecordIyanotPayload } from './rudcIyanot.interface';

const getRudcIyanotRecords = async (query: Record<string, unknown>, user: { id: number; role: string }) => {
  const { month, year, status, userId, page = 1, limit = 20 } = query;

  const take = Number(limit) || 20;
  const skip = (Number(page) - 1) * take;

  const whereConditions: any = {};

  // If member/volunteer, they can only see their own records
  if (user.role === UserRole.MEMBER) {
    whereConditions.userId = user.id;
  } else if (userId) {
    whereConditions.userId = Number(userId);
  }

  if (month && month !== 'ALL') {
    whereConditions.month = Number(month);
  }

  if (year && year !== 'ALL') {
    whereConditions.year = Number(year);
  }

  if (status && status !== 'ALL') {
    whereConditions.status = status as IyanotStatus;
  }

  const [total, records] = await Promise.all([
    prisma.rudcIyanot.count({ where: whereConditions }),
    prisma.rudcIyanot.findMany({
      where: whereConditions,
      skip,
      take,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            rudcMemberType: true,
            department: true,
          },
        },
        collectedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

const recordIyanotPayment = async (
  payload: TRecordIyanotPayload,
  actingUser: { id: number; role: string }
) => {
  const { userId, month, year, amount = 50, paymentMethod, transactionId, remarks } = payload;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'Target member not found!');
  }

  // If regular member is recording, verify ownership or permissions
  if (actingUser.role === UserRole.MEMBER && actingUser.id !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only submit iyanot payment for yourself!');
  }

  let collectedById: number | null = null;
  if (
    paymentMethod === IyanotPaymentMethod.CASH_OFFLINE &&
    (['SUPER_ADMIN', 'ADMIN', 'SHIFTER'] as string[]).includes(actingUser.role)
  ) {
    collectedById = actingUser.id;
  }

  const receiptNo = `RUDC-IYN-${year}${String(month).padStart(2, '0')}-${userId}-${Date.now().toString(36).toUpperCase()}`;

  const record = await prisma.rudcIyanot.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    create: {
      userId,
      month,
      year,
      amount,
      paymentMethod,
      status: IyanotStatus.PAID,
      collectedById,
      transactionId,
      receiptNo,
      remarks,
      paidAt: new Date(),
    },
    update: {
      amount,
      paymentMethod,
      status: IyanotStatus.PAID,
      collectedById: collectedById || undefined,
      transactionId: transactionId || undefined,
      remarks: remarks || undefined,
      paidAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          rudcMemberType: true,
        },
      },
      collectedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return record;
};

export const RudcIyanotService = {
  getRudcIyanotRecords,
  recordIyanotPayment,
};

import httpStatus from 'http-status';
import { PaymentMethod, PaymentStatus, UserRole, UserStatus } from '@prisma/client';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { hashPassword } from '../../utils/passwordHelpers';
import { TRegisterMember, TUpdateUser, TUpdateMyProfile, TRenewMembership } from './user.interface';

const registerMember = async (payload: TRegisterMember) => {
  if (!payload.email || !payload.phone || !payload.studentOrVoterId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Email, Phone, and Student/Voter ID are mandatory fields!'
    );
  }

  const isExistingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload.email },
        { phone: payload.phone },
        { studentOrVoterId: payload.studentOrVoterId },
      ],
    },
  });

  if (isExistingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email, phone, or Student/Voter ID already registered!');
  }

  const hashedPassword = await hashPassword(payload.password, config.bcrypt_salt_rounds);

  const paymentMethod = payload.paymentMethod || PaymentMethod.CASH;
  
  let membershipStartedAt: Date | null = payload.membershipStartedAt
    ? new Date(payload.membershipStartedAt)
    : null;
  let membershipExpiresAt: Date | null = payload.membershipExpiresAt
    ? new Date(payload.membershipExpiresAt)
    : null;
  let isPaid = payload.isPaid ?? false;

  let initialStatus = payload.status;
  if (!initialStatus) {
    if (membershipExpiresAt || payload.isPaid) {
      initialStatus = UserStatus.ACTIVE;
      isPaid = true;
      if (!membershipStartedAt) {
        membershipStartedAt = new Date();
      }
      if (!membershipExpiresAt) {
        const exp = new Date(membershipStartedAt.getTime());
        exp.setFullYear(exp.getFullYear() + 1);
        membershipExpiresAt = exp;
      }
    } else {
      initialStatus =
        paymentMethod === PaymentMethod.ONLINE
          ? UserStatus.PENDING_PAYMENT
          : UserStatus.PENDING_APPROVAL;
    }
  }

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      role: UserRole.MEMBER,
      status: initialStatus,
      paymentMethod,
      isPaid,
      membershipStartedAt,
      membershipExpiresAt,
      studentOrVoterId: payload.studentOrVoterId,
      institution: payload.institution || null,
      department: payload.department || null,
      session: payload.session || null,
    },
  });

  const { password: _, ...userData } = newUser;
  return userData;
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(prisma.user, query, {
    searchableFields: ['name', 'email', 'phone', 'studentOrVoterId', 'department', 'institution'],
    filterableFields: ['role', 'status', 'department', 'session', 'paymentMethod', 'isPaid'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.execute();

  const sanitizedData = result.data.map((user: any) => {
    const { password, ...rest } = user;
    return rest;
  });

  return {
    meta: result.meta,
    data: sanitizedData,
  };
};

const getUserByIdFromDB = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const { password, ...userData } = user;
  return userData;
};

const updateUserInDB = async (
  id: number,
  payload: TUpdateUser,
  authUser?: { role: UserRole; userId: number }
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Shifters are strictly forbidden from modifying user roles (own, other members, or staff)
  if (authUser && authUser.role === UserRole.SHIFTER) {
    if (payload.role !== undefined && payload.role !== user.role) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Shifters are not permitted to change user roles of members, others, or their own!'
      );
    }
  }

  const updateData: Record<string, any> = { ...payload };

  if (payload.membershipStartedAt !== undefined) {
    updateData.membershipStartedAt = payload.membershipStartedAt
      ? new Date(payload.membershipStartedAt)
      : null;
  }
  if (payload.membershipExpiresAt !== undefined) {
    updateData.membershipExpiresAt = payload.membershipExpiresAt
      ? new Date(payload.membershipExpiresAt)
      : null;
  }

  // When status is set to ACTIVE, automatically update isPaid to true & set membership dates if missing
  if (payload.status === UserStatus.ACTIVE) {
    updateData.isPaid = true;

    if (!user.membershipStartedAt && !updateData.membershipStartedAt) {
      const startDate = new Date();
      const expireDate = new Date(startDate.getTime());
      expireDate.setFullYear(expireDate.getFullYear() + 1);

      updateData.membershipStartedAt = startDate;
      updateData.membershipExpiresAt = expireDate;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const { password, ...userData } = updatedUser;
  return userData;
};

const approveCashPaymentInDB = async (userId: number, amount?: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const now = new Date();
  const expireDate = new Date(now.getTime());
  expireDate.setFullYear(expireDate.getFullYear() + 1);
  const membershipAmount = amount || 500;
  const transactionId = `CASH-MEM-${user.id}-${Date.now()}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        isPaid: true,
        paymentMethod: PaymentMethod.CASH,
        membershipStartedAt: now,
        membershipExpiresAt: expireDate,
      },
    });

    const paymentRecord = await tx.payment.create({
      data: {
        transactionId,
        userId,
        amount: membershipAmount,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        paidAt: now,
      },
    });

    const { password: _, ...userData } = updatedUser;
    return { user: userData, payment: paymentRecord };
  });

  return result;
};

const updateMyProfileInDB = async (userId: number, payload: TUpdateMyProfile) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Strictly only allow safe profile fields to be updated
  const safeData: Partial<TUpdateMyProfile> = {};
  if (payload.name !== undefined) safeData.name = payload.name;
  if (payload.avatarUrl !== undefined) safeData.avatarUrl = payload.avatarUrl;
  if (payload.department !== undefined) safeData.department = payload.department;
  if (payload.session !== undefined) safeData.session = payload.session;
  if (payload.institution !== undefined) safeData.institution = payload.institution;
  if (payload.phone !== undefined) safeData.phone = payload.phone;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: safeData,
  });

  const { password: _, ...userData } = updatedUser;
  return userData;
};

const renewMembershipInDB = async (userId: number, payload: TRenewMembership) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const now = new Date();
  let baseDate = now;
  if (user.membershipExpiresAt && new Date(user.membershipExpiresAt) > now) {
    baseDate = new Date(user.membershipExpiresAt);
  }
  const expireDate = new Date(baseDate.getTime());
  expireDate.setMonth(expireDate.getMonth() + 6); // 6 months extension (100 Taka)

  const amount = payload.amount || 100;
  const paymentMethod = payload.paymentMethod || PaymentMethod.CASH;
  const transactionId = `MEM-RENEW-${user.id}-${Date.now()}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        isPaid: true,
        paymentMethod,
        membershipStartedAt: user.membershipStartedAt || now,
        membershipExpiresAt: expireDate,
      },
    });

    const paymentRecord = await tx.payment.create({
      data: {
        transactionId,
        userId,
        amount,
        paymentMethod,
        status: PaymentStatus.COMPLETED,
        paidAt: now,
      },
    });

    const { password: _, ...userData } = updatedUser;
    return { user: userData, payment: paymentRecord };
  });

  return result;
};

import { sendMembershipNoticeAlert } from '../../utils/notificationSender';

const sendNoticeToUserInDB = async (
  userId: number,
  payload: { subject?: string; message: string }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User account not found!');
  }

  if (!payload.message || !payload.message.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Notice message cannot be empty!');
  }

  await sendMembershipNoticeAlert({
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    subject: payload.subject || `[Notice from RU Islamic Library] Account Expiry / Inactivity Warning`,
    message: payload.message,
    expiryDate: user.membershipExpiresAt,
    status: user.status,
  });

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    message: 'Notice alert successfully sent to member via email & mobile log.',
  };
};

const deleteUserFromDB = async (userId: number, requestingUserId: number) => {
  if (userId === requestingUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot delete your own Super Admin account!');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User account not found!');
  }

  // Check if member has active borrows before deletion
  const activeBorrows = await prisma.borrow.count({
    where: {
      userId,
      status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] },
    },
  });

  if (activeBorrows > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot delete user! Member currently has ${activeBorrows} active/overdue book loan(s) that must be returned first.`
    );
  }

  // Delete user record from DB
  return await prisma.user.delete({
    where: { id: userId },
  });
};

export const UserService = {
  registerMember,
  getAllUsersFromDB,
  getUserByIdFromDB,
  updateUserInDB,
  updateMyProfileInDB,
  renewMembershipInDB,
  approveCashPaymentInDB,
  sendNoticeToUserInDB,
  deleteUserFromDB,
};


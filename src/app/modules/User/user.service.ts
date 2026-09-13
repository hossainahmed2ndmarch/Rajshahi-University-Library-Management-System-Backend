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

  // Auto-set INACTIVE if membership is already expired
  if (
    membershipExpiresAt &&
    new Date(membershipExpiresAt) < new Date() &&
    initialStatus !== UserStatus.BLOCKED
  ) {
    initialStatus = UserStatus.INACTIVE;
    isPaid = false;
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
  // Automatically sync expired memberships to INACTIVE status (unless blocked)
  await prisma.user.updateMany({
    where: {
      status: UserStatus.ACTIVE,
      membershipExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: UserStatus.INACTIVE,
      isPaid: false,
    },
  });

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

  // Auto-sync status to INACTIVE if expired
  if (
    user.status === UserStatus.ACTIVE &&
    user.membershipExpiresAt &&
    new Date(user.membershipExpiresAt) < new Date()
  ) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
        isPaid: false,
      },
    });
    const { password: _, ...userData } = updatedUser;
    return userData;
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

  // Check uniqueness if email, phone, or studentOrVoterId is modified
  if (payload.email && payload.email !== user.email) {
    const existing = await prisma.user.findFirst({
      where: { email: payload.email, id: { not: id } },
    });
    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Email is already registered to another user!');
    }
  }

  if (payload.phone && payload.phone !== user.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: payload.phone, id: { not: id } },
    });
    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Phone number is already registered to another user!');
    }
  }

  if (payload.studentOrVoterId && payload.studentOrVoterId !== user.studentOrVoterId) {
    const existing = await prisma.user.findFirst({
      where: { studentOrVoterId: payload.studentOrVoterId, id: { not: id } },
    });
    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Student or Voter ID is already registered to another user!');
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

  const effectiveExpiry =
    updateData.membershipExpiresAt !== undefined
      ? updateData.membershipExpiresAt
      : user.membershipExpiresAt;

  const isExpired = effectiveExpiry && new Date(effectiveExpiry) < new Date();

  // Status handling:
  // 1. If explicitly set to BLOCKED, keep BLOCKED
  // 2. If user is currently BLOCKED and no status change provided, stay BLOCKED
  // 3. When membership is expired, status automatically becomes INACTIVE
  // 4. When membership is active/renewed, status automatically becomes ACTIVE & isPaid = true
  if (payload.status === UserStatus.BLOCKED) {
    updateData.status = UserStatus.BLOCKED;
  } else if (user.status === UserStatus.BLOCKED && payload.status === undefined) {
    updateData.status = UserStatus.BLOCKED;
  } else if (isExpired) {
    updateData.status = UserStatus.INACTIVE;
    updateData.isPaid = false;
  } else if (
    payload.status === UserStatus.ACTIVE ||
    (user.status === UserStatus.INACTIVE && !isExpired && effectiveExpiry)
  ) {
    updateData.status = UserStatus.ACTIVE;
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
  let baseDate = now;
  if (user.membershipExpiresAt && new Date(user.membershipExpiresAt) > now) {
    baseDate = new Date(user.membershipExpiresAt);
  }
  const expireDate = new Date(baseDate.getTime());

  // Pricing formula: 3 months = 100 Tk, 6 months = 200 Tk, 12 months = 400 Tk
  const months = amount ? Math.max(3, Math.round((amount / 100) * 3)) : 12;
  const membershipAmount = amount || (months / 3) * 100;
  expireDate.setMonth(expireDate.getMonth() + months);
  const transactionId = `CASH-MEM-${user.id}-${Date.now()}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        isPaid: true,
        paymentMethod: PaymentMethod.CASH,
        membershipStartedAt: user.membershipStartedAt || now,
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

  // A member can also update their Registered Email and Student / National Voter ID
  if (payload.email !== undefined && payload.email.trim() && payload.email.trim() !== user.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: payload.email.trim(), id: { not: userId } },
    });
    if (emailExists) {
      throw new AppError(httpStatus.BAD_REQUEST, 'This email address is already in use by another member!');
    }
    safeData.email = payload.email.trim();
  }

  if (
    payload.studentOrVoterId !== undefined &&
    payload.studentOrVoterId.trim() &&
    payload.studentOrVoterId.trim() !== user.studentOrVoterId
  ) {
    const idExists = await prisma.user.findFirst({
      where: { studentOrVoterId: payload.studentOrVoterId.trim(), id: { not: userId } },
    });
    if (idExists) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'This Student or Voter ID is already registered to another member!'
      );
    }
    safeData.studentOrVoterId = payload.studentOrVoterId.trim();
  }

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

  // Pricing formula: 3 months = 100 Tk, 6 months = 200 Tk, 12 months = 400 Tk
  let monthsToAdd = payload.months;
  let amount = payload.amount;
  if (monthsToAdd) {
    amount = amount || (monthsToAdd / 3) * 100;
  } else if (amount) {
    monthsToAdd = Math.max(3, Math.round((amount / 100) * 3));
  } else {
    monthsToAdd = 6;
    amount = 200;
  }

  expireDate.setMonth(expireDate.getMonth() + monthsToAdd);

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

const getUserOptionsFromDB = async () => {
  const users = await prisma.user.findMany({
    select: {
      department: true,
      session: true,
      institution: true,
    },
  });

  const departmentsSet = new Set<string>();
  const sessionsSet = new Set<string>();
  const institutionsSet = new Set<string>();

  users.forEach((u) => {
    if (u.department?.trim()) departmentsSet.add(u.department.trim());
    if (u.session?.trim()) sessionsSet.add(u.session.trim());
    if (u.institution?.trim()) institutionsSet.add(u.institution.trim());
  });

  const defaultDepts = [
    'Islamic Studies', 'Arabic', 'Philosophy', 'History', 'Sociology', 'Social Work', 'Economics',
    'Accounting & Information Systems', 'Management Studies', 'Marketing', 'Finance & Banking',
    'Law & Justice', 'International Relations', 'Political Science', 'Public Administration',
    'Psychology', 'Bangla', 'English', 'Statistics', 'Mathematics', 'Physics', 'Chemistry',
    'Botany', 'Zoology', 'Pharmacy', 'Computer Science & Engineering',
    'Information & Communication Engineering', 'Electrical & Electronic Engineering',
    'Applied Chemistry & Chemical Engineering', 'Materials Science & Engineering',
    'Geography & Environmental Studies', 'Geology & Mining', 'Agricultural Sciences',
    'Fisheries', 'Education', 'Physical Education', 'Fine Arts', 'Music', 'Theater',
  ];
  defaultDepts.forEach((d) => departmentsSet.add(d));

  const defaultSessions = [
    '2016-2017', '2017-2018', '2018-2019', '2019-2020', '2020-2021',
    '2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027',
  ];
  defaultSessions.forEach((s) => sessionsSet.add(s));

  return {
    departments: Array.from(departmentsSet).sort((a, b) => a.localeCompare(b)),
    sessions: Array.from(sessionsSet).sort((a, b) => a.localeCompare(b)),
    institutions: Array.from(institutionsSet).sort((a, b) => a.localeCompare(b)),
  };
};

export const UserService = {
  registerMember,
  getAllUsersFromDB,
  getUserByIdFromDB,
  getUserOptionsFromDB,
  updateUserInDB,
  updateMyProfileInDB,
  renewMembershipInDB,
  approveCashPaymentInDB,
  sendNoticeToUserInDB,
  deleteUserFromDB,
};


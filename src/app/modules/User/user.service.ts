import httpStatus from 'http-status';
import {
  Organization,
  PaymentMethod,
  PaymentStatus,
  RudcApplicationStatus,
  RudcMemberType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { hashPassword } from '../../utils/passwordHelpers';
import {
  TRegisterMember,
  TUpdateUser,
  TUpdateMyProfile,
  TRenewMembership,
  TConvertMembership,
} from './user.interface';

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
      faculty: payload.faculty || null,
      whatsappNumber: payload.whatsappNumber || null,
      bloodGroup: payload.bloodGroup || null,
      skills: payload.skills || [],
      accommodationType: payload.accommodationType || null,
      accommodationName: payload.accommodationName || null,
      permanentAddress: payload.permanentAddress || null,
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

  const { org, isRudcMember, ...remainingQuery } = query;

  const userQuery = new QueryBuilder(prisma.user, remainingQuery, {
    searchableFields: ['name', 'email', 'phone', 'studentOrVoterId', 'department', 'institution'],
    filterableFields: ['role', 'status', 'department', 'session', 'paymentMethod', 'isPaid'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .fields();

  if (org && org !== 'ALL') {
    if (org === 'RUDC') {
      userQuery.where({
        OR: [
          { org: { in: ['RUDC', 'BOTH'] } },
          { isRudcMember: true },
        ],
      });
    } else if (org === 'RUIL') {
      userQuery.where({ org: { in: ['RUIL', 'BOTH'] } });
    } else {
      userQuery.where({ org });
    }
  }

  if (isRudcMember !== undefined && isRudcMember !== 'ALL') {
    userQuery.where({ isRudcMember: isRudcMember === 'true' || isRudcMember === true });
  }

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

  // If user role was changed or demoted to MEMBER, deactivate their active duty schedules
  if (updateData.role === UserRole.MEMBER) {
    await prisma.shifterSchedule.updateMany({
      where: { shifterId: id },
      data: { isActive: false },
    });
  }

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

  const safeData: Partial<TUpdateMyProfile> = {};
  if (payload.name !== undefined) safeData.name = payload.name;
  if (payload.avatarUrl !== undefined) safeData.avatarUrl = payload.avatarUrl;
  if (payload.department !== undefined) safeData.department = payload.department;
  if (payload.session !== undefined) safeData.session = payload.session;
  if (payload.institution !== undefined) safeData.institution = payload.institution;
  if (payload.phone !== undefined) safeData.phone = payload.phone;
  if (payload.faculty !== undefined) safeData.faculty = payload.faculty;
  if (payload.whatsappNumber !== undefined) safeData.whatsappNumber = payload.whatsappNumber;
  if (payload.bloodGroup !== undefined) safeData.bloodGroup = payload.bloodGroup;
  if (payload.skills !== undefined) safeData.skills = payload.skills;
  if (payload.accommodationType !== undefined) safeData.accommodationType = payload.accommodationType;
  if (payload.accommodationName !== undefined) safeData.accommodationName = payload.accommodationName;
  if (payload.permanentAddress !== undefined) safeData.permanentAddress = payload.permanentAddress;

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
      faculty: true,
      accommodationName: true,
      skills: true,
      permanentAddress: true,
    },
  });

  const departmentsSet = new Set<string>();
  const sessionsSet = new Set<string>();
  const institutionsSet = new Set<string>();
  const facultiesSet = new Set<string>();
  const accommodationNamesSet = new Set<string>();
  const skillsSet = new Set<string>();
  const villagesSet = new Set<string>();

  users.forEach((u) => {
    if (u.department?.trim()) departmentsSet.add(u.department.trim());
    if (u.session?.trim()) sessionsSet.add(u.session.trim());
    if (u.institution?.trim()) institutionsSet.add(u.institution.trim());
    if (u.faculty?.trim()) facultiesSet.add(u.faculty.trim());
    if (u.accommodationName?.trim()) accommodationNamesSet.add(u.accommodationName.trim());
    if (Array.isArray(u.skills)) {
      u.skills.forEach((s) => {
        if (s?.trim()) skillsSet.add(s.trim());
      });
    }
    if (u.permanentAddress?.trim()) {
      try {
        const parsed = JSON.parse(u.permanentAddress);
        if (parsed?.village?.trim()) villagesSet.add(parsed.village.trim());
      } catch {
        // Plain text address or non-JSON
      }
    }
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

  const defaultFaculties = [
    'Faculty of Arts',
    'Faculty of Law',
    'Faculty of Science',
    'Faculty of Business Studies',
    'Faculty of Social Science',
    'Faculty of Agriculture',
    'Faculty of Engineering',
    'Faculty of Fine Arts',
    'Faculty of Geosciences',
    'Faculty of Fisheries',
    'Faculty of Veterinary and Animal Sciences',
    'Institute of Bangladesh Studies',
    'Institute of Biological Sciences',
  ];
  defaultFaculties.forEach((f) => facultiesSet.add(f));

  const defaultSessions = [
    '2016-2017', '2017-2018', '2018-2019', '2019-2020', '2020-2021',
    '2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027',
  ];
  defaultSessions.forEach((s) => sessionsSet.add(s));

  const defaultAccommodations = [
    'Shah Makhdum Hall', 'Nawab Abdul Latif Hall', 'Syed Amir Ali Hall',
    'Shahid Shamsuzzoha Hall', 'Shahid Habibur Rahman Hall', 'Motihar Hall',
    'Madar Bux Hall', 'Suhrawardy Hall', 'Shahid Ziaur Rahman Hall',
    'Bangabandhu Sheikh Mujibur Rahman Hall', 'Mannujan Hall', 'Rokeya Hall',
    'Tapashi Rabeya Hall', 'Begum Khaleda Zia Hall', 'Rahamatunnesa Hall',
    'Bangamata Sheikh Fazilatunnesa Mujib Hall', 'Resident Area / Mess'
  ];
  defaultAccommodations.forEach((a) => accommodationNamesSet.add(a));

  const defaultSkills = [
    'Dawah & Public Speaking', 'Content Writing', 'Graphic Design',
    'Video Editing', 'Web Development', 'Event Management', 'Social Media Management',
    'Photography', 'Recitation (Qirat)', 'Teaching / Mentoring', 'Logistics & Coordination'
  ];
  defaultSkills.forEach((s) => skillsSet.add(s));

  return {
    departments: Array.from(departmentsSet).sort((a, b) => a.localeCompare(b)),
    faculties: Array.from(facultiesSet).sort((a, b) => a.localeCompare(b)),
    sessions: Array.from(sessionsSet).sort((a, b) => a.localeCompare(b)),
    institutions: Array.from(institutionsSet).sort((a, b) => a.localeCompare(b)),
    accommodationNames: Array.from(accommodationNamesSet).sort((a, b) => a.localeCompare(b)),
    skills: Array.from(skillsSet).sort((a, b) => a.localeCompare(b)),
    villages: Array.from(villagesSet).sort((a, b) => a.localeCompare(b)),
  };
};

const convertMembershipInDB = async (payload: TConvertMembership) => {
  const {
    userIds,
    targetRoleOrOrg,
    confirmPayment = false,
    paymentMethod = PaymentMethod.CASH,
    months = 12,
  } = payload;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  if (users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No users found for the provided IDs!');
  }

  const results = [];

  for (const user of users) {
    const updateData: Record<string, any> = {};
    let paymentRecord: any = null;

    if (targetRoleOrOrg === 'MAKE_RUDC_MEMBER') {
      updateData.isRudcMember = true;
      updateData.rudcMemberType = RudcMemberType.MEMBER;
      updateData.rudcStatus = RudcApplicationStatus.APPROVED;
      if (!user.rudcJoinedAt) updateData.rudcJoinedAt = new Date();
      if (user.org === Organization.RUIL) {
        updateData.org = Organization.BOTH;
      }
    } else if (targetRoleOrOrg === 'MAKE_RUDC_VOLUNTEER') {
      updateData.isRudcMember = true;
      updateData.rudcMemberType = RudcMemberType.VOLUNTEER;
      updateData.rudcStatus = RudcApplicationStatus.APPROVED;
      if (!user.rudcJoinedAt) updateData.rudcJoinedAt = new Date();
      if (user.org === Organization.RUIL) {
        updateData.org = Organization.BOTH;
      }
    } else if (targetRoleOrOrg === 'MAKE_RUIL_MEMBER') {
      const now = new Date();
      const hasActivePaidMembership =
        user.isPaid &&
        user.membershipExpiresAt &&
        new Date(user.membershipExpiresAt) > now;

      if (!hasActivePaidMembership && !confirmPayment) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `User "${user.name}" (#${user.id}) does not have an active RUIL paid membership! Please confirm payment to grant RUIL membership.`
        );
      }

      if (!hasActivePaidMembership && confirmPayment) {
        let baseDate = now;
        if (user.membershipExpiresAt && new Date(user.membershipExpiresAt) > now) {
          baseDate = new Date(user.membershipExpiresAt);
        }
        const expireDate = new Date(baseDate.getTime());
        expireDate.setMonth(expireDate.getMonth() + (months || 12));

        updateData.isPaid = true;
        updateData.status = UserStatus.ACTIVE;
        updateData.paymentMethod = paymentMethod;
        updateData.membershipStartedAt = user.membershipStartedAt || now;
        updateData.membershipExpiresAt = expireDate;

        const membershipAmount = ((months || 12) / 3) * 100;
        const transactionId = `CONVERT-MEM-${user.id}-${Date.now()}`;
        paymentRecord = {
          transactionId,
          userId: user.id,
          amount: membershipAmount,
          paymentMethod,
          status: PaymentStatus.COMPLETED,
          paidAt: now,
        };
      }

      if (user.org === Organization.RUDC) {
        updateData.org = Organization.BOTH;
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (paymentRecord) {
        await tx.payment.create({
          data: paymentRecord,
        });
      }

      return u;
    });

    const { password: _, ...userData } = updatedUser;
    results.push(userData);
  }

  return results;
};

export const UserService = {
  registerMember,
  getAllUsersFromDB,
  getUserByIdFromDB,
  getUserOptionsFromDB,
  updateUserInDB,
  updateMyProfileInDB,
  renewMembershipInDB,
  convertMembershipInDB,
  approveCashPaymentInDB,
  sendNoticeToUserInDB,
  deleteUserFromDB,
};


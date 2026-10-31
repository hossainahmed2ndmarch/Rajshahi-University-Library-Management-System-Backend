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
import { formatUserWithRudcProfile } from '../RudcMember/rudcMember.service';
import {
  TRegisterMember,
  TUpdateUser,
  TUpdateMyProfile,
  TRenewMembership,
  TConvertMembership,
  TBulkUpdateUsers,
  TBulkDeleteUsers,
  TCustomNotice,
} from './user.interface';

const registerMember = async (payload: TRegisterMember) => {
  if (!payload.name) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Name is a mandatory field!');
  }

  // Check unique constraints for email and phone if provided
  if (payload.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existingEmail) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Email is already registered!');
    }
  }

  if (payload.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: payload.phone },
    });
    if (existingPhone) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Phone number is already registered!');
    }
  }

  if (payload.studentOrVoterId) {
    const existingAcademic = await prisma.academicProfile.findUnique({
      where: { studentOrVoterId: payload.studentOrVoterId },
    });
    if (existingAcademic) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Student / Voter ID is already registered!');
    }
  }

  const hashedPassword = payload.password
    ? await hashPassword(payload.password, config.bcrypt_salt_rounds)
    : null;

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

  const targetRole = payload.role || UserRole.MEMBER;
  const targetOrg = payload.org || Organization.RUIL;

  const newUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email || null,
        phone: payload.phone || null,
        password: hashedPassword,
        role: targetRole,
        status: initialStatus,
        gender: payload.gender || null,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
        org: targetOrg,
      },
    });

    // 1. Create AcademicProfile if student details provided
    if (payload.studentOrVoterId || payload.department || payload.session || payload.faculty) {
      await tx.academicProfile.create({
        data: {
          userId: createdUser.id,
          institution: payload.institution || 'University of Rajshahi',
          faculty: payload.faculty || 'General',
          department: payload.department || 'General',
          session: payload.session || '2025-2026',
          studentOrVoterId: payload.studentOrVoterId || `ID-${createdUser.id}`,
          bloodGroup: payload.bloodGroup || null,
          accommodationType: payload.accommodationType || null,
          accommodationName: payload.accommodationName || null,
        },
      });
    }

    // 2. Create RUIL Profile if targetOrg includes RUIL
    if (targetOrg === Organization.RUIL || targetOrg === Organization.BOTH) {
      await tx.ruilMemberProfile.create({
        data: {
          userId: createdUser.id,
          membershipStatus: initialStatus,
          isPaid,
          paymentMethod,
          paymentTrxId: payload.paymentTrxId || null,
          membershipStartedAt,
          membershipExpiresAt,
          maxBorrowLimit: 2,
        },
      });
    }

    // 3. Create RUDC Profile if targetOrg includes RUDC
    if (targetOrg === Organization.RUDC || targetOrg === Organization.BOTH) {
      await tx.rudcMemberProfile.create({
        data: {
          userId: createdUser.id,
          whatsappNumber: payload.whatsappNumber || payload.phone || null,
          skills: payload.skills || [],
          permanentAddress: payload.permanentAddress || null,
          rudcMemberType: payload.rudcMemberType || RudcMemberType.VOLUNTEER,
          rudcStatus: payload.rudcStatus || RudcApplicationStatus.PENDING_REVIEW,
          rudcJoinedAt: isPaid ? new Date() : null,
        },
      });
    }

    return await tx.user.findUnique({
      where: { id: createdUser.id },
      include: {
        academicProfile: true,
        ruilProfile: true,
        rudcProfile: true,
      },
    });
  });

  const { password: _, ...userData } = newUser as any;
  return formatUserWithRudcProfile(userData);
};

// Bulk Member Registration by Admin/Shifter
const registerBulkMembersInDB = async (members: TRegisterMember[], targetOrg?: Organization) => {
  const results = [];
  for (const member of members) {
    try {
      const created = await registerMember({
        ...member,
        org: targetOrg || member.org || Organization.RUIL,
      });
      results.push({ success: true, email: member.email, data: created });
    } catch (err: any) {
      results.push({ success: false, email: member.email, error: err.message });
    }
  }
  return results;
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const { org, isRudcMember, ...remainingQuery } = query;

  const userQuery = new QueryBuilder(prisma.user, remainingQuery, {
    searchableFields: ['name', 'email', 'phone'],
    filterableFields: ['role', 'status', 'gender'],
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
          { rudcProfile: { isRudcMember: true } },
        ],
      });
    } else if (org === 'RUIL') {
      userQuery.where({ org: { in: ['RUIL', 'BOTH'] } });
    } else {
      userQuery.where({ org });
    }
  }

  if (isRudcMember !== undefined && isRudcMember !== 'ALL') {
    userQuery.where({
      rudcProfile: {
        isRudcMember: isRudcMember === 'true' || isRudcMember === true,
      },
    });
  }

  userQuery.include({
    rudcProfile: true,
    ruilProfile: true,
    academicProfile: true,
  });

  const result = await userQuery.execute();

  const sanitizedData = result.data.map((user: any) => {
    const { password, ...rest } = user;
    return formatUserWithRudcProfile(rest);
  });

  return {
    meta: result.meta,
    data: sanitizedData,
  };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      academicProfile: true,
      ruilProfile: true,
      addresses: true,
      rudcProfile: {
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const { password, ...userData } = user;
  return formatUserWithRudcProfile(userData);
};

const updateUserInDB = async (
  id: string,
  payload: TUpdateUser,
  authUser?: { role: UserRole; userId: string }
) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { academicProfile: true, ruilProfile: true, rudcProfile: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (authUser && authUser.role === UserRole.SHIFTER) {
    if (payload.role !== undefined && payload.role !== user.role) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Shifters are not permitted to change user roles!'
      );
    }
  }

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

  const userUpdateData: Record<string, any> = {};
  if (payload.name) userUpdateData.name = payload.name;
  if (payload.email) userUpdateData.email = payload.email;
  if (payload.phone) userUpdateData.phone = payload.phone;
  if (payload.avatarUrl) userUpdateData.avatarUrl = payload.avatarUrl;
  if (payload.gender !== undefined) userUpdateData.gender = payload.gender;
  if (payload.dateOfBirth !== undefined)
    userUpdateData.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
  if (payload.role) userUpdateData.role = payload.role;
  if (payload.status) userUpdateData.status = payload.status;
  if (payload.org) userUpdateData.org = payload.org;

  await prisma.$transaction(async (tx) => {
    // 1. Update root User
    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({ where: { id }, data: userUpdateData });
    }

    // 2. Update/Upsert AcademicProfile
    const hasAcademicUpdates =
      payload.institution ||
      payload.faculty ||
      payload.department ||
      payload.session ||
      payload.studentOrVoterId ||
      payload.bloodGroup !== undefined ||
      payload.accommodationType !== undefined ||
      payload.accommodationName !== undefined;

    if (hasAcademicUpdates) {
      const academicData: Record<string, any> = {};
      if (payload.institution) academicData.institution = payload.institution;
      if (payload.faculty) academicData.faculty = payload.faculty;
      if (payload.department) academicData.department = payload.department;
      if (payload.session) academicData.session = payload.session;
      if (payload.studentOrVoterId) academicData.studentOrVoterId = payload.studentOrVoterId;
      if (payload.bloodGroup !== undefined) academicData.bloodGroup = payload.bloodGroup;
      if (payload.accommodationType !== undefined) academicData.accommodationType = payload.accommodationType;
      if (payload.accommodationName !== undefined) academicData.accommodationName = payload.accommodationName;

      await tx.academicProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          faculty: payload.faculty || 'General',
          department: payload.department || 'General',
          session: payload.session || '2025-2026',
          studentOrVoterId: payload.studentOrVoterId || `ID-${id}`,
          ...academicData,
        },
        update: academicData,
      });
    }

    // 3. Update/Upsert RuilProfile
    const hasRuilUpdates =
      payload.isPaid !== undefined ||
      payload.paymentMethod !== undefined ||
      payload.membershipStartedAt !== undefined ||
      payload.membershipExpiresAt !== undefined ||
      payload.status !== undefined;

    if (hasRuilUpdates) {
      const ruilData: Record<string, any> = {};
      if (payload.isPaid !== undefined) ruilData.isPaid = payload.isPaid;
      if (payload.paymentMethod !== undefined) ruilData.paymentMethod = payload.paymentMethod;
      if (payload.status) ruilData.membershipStatus = payload.status;
      if (payload.membershipStartedAt) ruilData.membershipStartedAt = new Date(payload.membershipStartedAt);
      if (payload.membershipExpiresAt) ruilData.membershipExpiresAt = new Date(payload.membershipExpiresAt);

      await tx.ruilMemberProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          membershipStatus: payload.status || UserStatus.ACTIVE,
          isPaid: payload.isPaid ?? true,
          ...ruilData,
        },
        update: ruilData,
      });
    }

    // 4. Update/Upsert RudcProfile
    const hasRudcUpdates =
      payload.whatsappNumber !== undefined ||
      payload.skills !== undefined ||
      payload.permanentAddress !== undefined ||
      payload.isRudcMember !== undefined ||
      payload.rudcMemberType !== undefined ||
      payload.rudcStatus !== undefined ||
      payload.supervisorId !== undefined;

    if (hasRudcUpdates) {
      const rudcData: Record<string, any> = {};
      if (payload.whatsappNumber !== undefined) rudcData.whatsappNumber = payload.whatsappNumber;
      if (payload.skills !== undefined) rudcData.skills = payload.skills;
      if (payload.permanentAddress !== undefined) rudcData.permanentAddress = payload.permanentAddress;
      if (payload.isRudcMember !== undefined) rudcData.isRudcMember = payload.isRudcMember;
      if (payload.rudcMemberType !== undefined) rudcData.rudcMemberType = payload.rudcMemberType;
      if (payload.rudcStatus !== undefined) rudcData.rudcStatus = payload.rudcStatus;
      if (payload.supervisorId !== undefined) rudcData.supervisorId = payload.supervisorId;

      await tx.rudcMemberProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          isRudcMember: payload.isRudcMember ?? false,
          ...rudcData,
        },
        update: rudcData,
      });
    }
  });

  return await getUserByIdFromDB(id);
};

// Bulk Update Users
const bulkUpdateUsersInDB = async (payload: TBulkUpdateUsers) => {
  const { userIds, status, role, org } = payload;
  const updateData: Record<string, any> = {};
  if (status) updateData.status = status;
  if (role) updateData.role = role;
  if (org) updateData.org = org;

  const result = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: updateData,
  });

  return {
    updatedCount: result.count,
    message: `${result.count} users updated successfully!`,
  };
};

// Bulk Delete Users
const bulkDeleteUsersInDB = async (payload: TBulkDeleteUsers) => {
  const { userIds } = payload;
  const result = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  return {
    deletedCount: result.count,
    message: `${result.count} users deleted successfully!`,
  };
};

const updateMyProfileInDB = async (userId: string, payload: TUpdateMyProfile) => {
  return await updateUserInDB(userId, payload);
};

const approveCashPaymentInDB = async (userId: string, amount?: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ruilProfile: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const now = new Date();
  const expireDate = new Date(now.getTime());
  expireDate.setFullYear(expireDate.getFullYear() + 1);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    await tx.ruilMemberProfile.upsert({
      where: { userId },
      create: {
        userId,
        membershipStatus: UserStatus.ACTIVE,
        isPaid: true,
        paymentMethod: PaymentMethod.CASH,
        membershipStartedAt: now,
        membershipExpiresAt: expireDate,
      },
      update: {
        membershipStatus: UserStatus.ACTIVE,
        isPaid: true,
        paymentMethod: PaymentMethod.CASH,
        membershipStartedAt: user.ruilProfile?.membershipStartedAt || now,
        membershipExpiresAt: expireDate,
      },
    });

    await tx.payment.create({
      data: {
        transactionId: `CASH-${userId}-${Date.now()}`,
        userId,
        amount: amount || 200,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        paidAt: now,
      },
    });
  });

  return await getUserByIdFromDB(userId);
};

const renewMembershipInDB = async (userId: string, payload: TRenewMembership) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ruilProfile: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User account not found!');
  }

  const months = payload.months || 6;
  const now = new Date();
  let baseDate = now;

  if (user.ruilProfile?.membershipExpiresAt && new Date(user.ruilProfile.membershipExpiresAt) > now) {
    baseDate = new Date(user.ruilProfile.membershipExpiresAt);
  }

  const expireDate = new Date(baseDate.getTime());
  expireDate.setMonth(expireDate.getMonth() + months);

  await prisma.ruilMemberProfile.upsert({
    where: { userId },
    create: {
      userId,
      membershipStatus: UserStatus.ACTIVE,
      isPaid: true,
      membershipStartedAt: now,
      membershipExpiresAt: expireDate,
    },
    update: {
      membershipStatus: UserStatus.ACTIVE,
      isPaid: true,
      membershipExpiresAt: expireDate,
    },
  });

  return await getUserByIdFromDB(userId);
};

// Enhanced Bulk Conversion Engine
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
    include: { rudcProfile: true, ruilProfile: true, academicProfile: true },
  });

  if (users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No users found for the provided IDs!');
  }

  const results = [];

  for (const user of users) {
    const now = new Date();

    if (targetRoleOrOrg === 'MAKE_RUDC_MEMBER' || targetRoleOrOrg === 'MAKE_RUDC_VOLUNTEER') {
      const memberType =
        targetRoleOrOrg === 'MAKE_RUDC_MEMBER' ? RudcMemberType.MEMBER : RudcMemberType.VOLUNTEER;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            role: UserRole.MEMBER,
            org: user.org === Organization.RUIL ? Organization.BOTH : Organization.RUDC,
          },
        });

        if (payload.department || payload.session || payload.faculty || payload.studentOrVoterId || !user.academicProfile) {
          await tx.academicProfile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              institution: 'University of Rajshahi',
              faculty: payload.faculty || 'General',
              department: payload.department || 'General',
              session: payload.session || '2025-2026',
              studentOrVoterId: payload.studentOrVoterId || `ID-${user.id}`,
            },
            update: {
              faculty: payload.faculty || undefined,
              department: payload.department || undefined,
              session: payload.session || undefined,
              studentOrVoterId: payload.studentOrVoterId || undefined,
            },
          });
        }

        await tx.rudcMemberProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            isRudcMember: true,
            rudcMemberType: memberType,
            rudcStatus: RudcApplicationStatus.APPROVED,
            rudcJoinedAt: now,
          },
          update: {
            isRudcMember: true,
            rudcMemberType: memberType,
            rudcStatus: RudcApplicationStatus.APPROVED,
            rudcJoinedAt: user.rudcProfile?.rudcJoinedAt || now,
          },
        });
      });
      results.push({ userId: user.id, status: 'CONVERTED_TO_RUDC' });
    } else if (targetRoleOrOrg === 'MAKE_RUIL_MEMBER') {
      const expireDate = new Date(now.getTime());
      expireDate.setMonth(expireDate.getMonth() + months);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            role: UserRole.MEMBER,
            org: user.org === Organization.RUDC ? Organization.BOTH : Organization.RUIL,
          },
        });

        if (payload.department || payload.session || payload.faculty || payload.studentOrVoterId || !user.academicProfile) {
          await tx.academicProfile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              institution: 'University of Rajshahi',
              faculty: payload.faculty || 'General',
              department: payload.department || 'General',
              session: payload.session || '2025-2026',
              studentOrVoterId: payload.studentOrVoterId || `ID-${user.id}`,
            },
            update: {
              faculty: payload.faculty || undefined,
              department: payload.department || undefined,
              session: payload.session || undefined,
              studentOrVoterId: payload.studentOrVoterId || undefined,
            },
          });
        }

        await tx.ruilMemberProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            membershipStatus: UserStatus.ACTIVE,
            isPaid: confirmPayment,
            paymentMethod,
            membershipStartedAt: now,
            membershipExpiresAt: expireDate,
          },
          update: {
            membershipStatus: UserStatus.ACTIVE,
            isPaid: confirmPayment || user.ruilProfile?.isPaid || false,
            membershipExpiresAt: expireDate,
          },
        });
      });
      results.push({ userId: user.id, status: 'CONVERTED_TO_RUIL' });
    } else if (targetRoleOrOrg === 'MAKE_GENERAL_USER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.GENERAL_USER },
      });
      results.push({ userId: user.id, status: 'CONVERTED_TO_GENERAL_USER' });
    }
  }

  return results;
};

// CMS-Style Customizable Email Notice Dispatcher
const sendCustomNoticeInDB = async (payload: TCustomNotice) => {
  const { userIds, recipients, subject, htmlContent } = payload;
  const { sendEmail, compileEmailTemplate } = await import('../../utils/emailSender');

  const recipientsList: { email: string; name?: string }[] = [];

  if (userIds && userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true, name: true },
    });
    users.forEach((u) => {
      if (u.email) recipientsList.push({ email: u.email, name: u.name });
    });
  }

  if (recipients && recipients.length > 0) {
    recipients.forEach((email) => {
      if (!recipientsList.some((r) => r.email === email)) {
        recipientsList.push({ email, name: 'Member' });
      }
    });
  }

  let successCount = 0;
  for (const item of recipientsList) {
    const personalizedHtml = compileEmailTemplate(htmlContent, {
      name: item.name || 'Member',
    });
    const personalizedSubject = compileEmailTemplate(subject, {
      name: item.name || 'Member',
    });

    const success = await sendEmail({
      to: item.email,
      subject: personalizedSubject,
      html: personalizedHtml,
    });
    if (success) successCount++;
  }

  return {
    totalRecipients: recipientsList.length,
    sentSuccessfully: successCount,
  };
};

const getEmailNoticeTemplatesInDB = async () => {
  const { DefaultEmailTemplates } = await import('../../utils/emailSender');
  return DefaultEmailTemplates;
};

const sendNoticeToUserInDB = async (userId: string, payload: { subject?: string; message?: string }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.email) {
    throw new AppError(httpStatus.NOT_FOUND, 'User email not found!');
  }

  return await sendCustomNoticeInDB({
    recipients: [user.email],
    subject: payload.subject || '[Notice from RU Islamic Library]',
    htmlContent: `<p>${payload.message || 'Important update regarding your account.'}</p>`,
  });
};

const deleteUserFromDB = async (userId: string, requestingUserId: string) => {
  if (userId === requestingUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot delete your own account!');
  }

  return await prisma.user.delete({
    where: { id: userId },
  });
};

const getUserOptionsFromDB = async () => {
  const [departments, sessions, faculties] = await Promise.all([
    prisma.academicProfile.findMany({ distinct: ['department'], select: { department: true } }),
    prisma.academicProfile.findMany({ distinct: ['session'], select: { session: true } }),
    prisma.academicProfile.findMany({ distinct: ['faculty'], select: { faculty: true } }),
  ]);

  return {
    departments: departments.map((d) => d.department).filter(Boolean),
    sessions: sessions.map((s) => s.session).filter(Boolean),
    faculties: faculties.map((f) => f.faculty).filter(Boolean),
  };
};

// Public Member Counts for Landing Page (Unauthenticated)
const getPublicStatsInDB = async () => {
  const [activeRuilMembers, approvedRudcMembers, totalBooks, totalArticles] = await Promise.all([
    prisma.ruilMemberProfile.count({
      where: { membershipStatus: UserStatus.ACTIVE },
    }),
    prisma.rudcMemberProfile.count({
      where: { rudcStatus: RudcApplicationStatus.APPROVED },
    }),
    prisma.book.count({
      where: { isArchived: false },
    }),
    prisma.article.count({
      where: { isPublished: true },
    }),
  ]);

  return {
    ruilMembersCount: activeRuilMembers,
    rudcMembersCount: approvedRudcMembers,
    totalBooksCount: totalBooks,
    totalArticlesCount: totalArticles,
  };
};

export const UserService = {
  registerMember,
  registerBulkMembersInDB,
  getAllUsersFromDB,
  getUserByIdFromDB,
  getUserOptionsFromDB,
  updateUserInDB,
  updateMyProfileInDB,
  approveCashPaymentInDB,
  renewMembershipInDB,
  convertMembershipInDB,
  bulkUpdateUsersInDB,
  bulkDeleteUsersInDB,
  sendCustomNoticeInDB,
  getEmailNoticeTemplatesInDB,
  sendNoticeToUserInDB,
  deleteUserFromDB,
  getPublicStatsInDB,
};

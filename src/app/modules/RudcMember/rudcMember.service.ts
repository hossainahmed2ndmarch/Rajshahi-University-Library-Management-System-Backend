import httpStatus from 'http-status';
import {
  Organization,
  RudcApplicationStatus,
  RudcMemberType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import prisma from '../../../lib/db';
import AppError from '../../errors/AppError';
import config from '../../config';
import { hashPassword } from '../../utils/passwordHelpers';
import sendEmail from '../../utils/emailSender';
import {
  TCreatePreExistedRudcMemberPayload,
  TRudcApplyPayload,
  TSendInterviewEmailPayload,
  TUpdateRudcMemberPayload,
} from './rudcMember.interface';

/**
 * Normalization helper: formats a User record with their 1:1 RudcMemberProfile
 * so both nested (user.rudcProfile) and flat properties (user.whatsappNumber, user.rudcStatus)
 * remain 100% backward compatible for all existing API clients.
 */
export const formatUserWithRudcProfile = (user: any) => {
  if (!user) return user;
  const rudc = user.rudcProfile;
  return {
    ...user,
    rudcProfile: rudc || null,
    // Flattened aliases for backward compatibility with frontend
    faculty: rudc?.faculty ?? user.faculty ?? null,
    whatsappNumber: rudc?.whatsappNumber ?? user.whatsappNumber ?? null,
    bloodGroup: rudc?.bloodGroup ?? user.bloodGroup ?? null,
    skills: rudc?.skills ?? (Array.isArray(user.skills) ? user.skills : []),
    accommodationType: rudc?.accommodationType ?? user.accommodationType ?? null,
    accommodationName: rudc?.accommodationName ?? user.accommodationName ?? null,
    permanentAddress: rudc?.permanentAddress ?? user.permanentAddress ?? null,
    isAffiliatedWithOther: rudc?.isAffiliatedWithOther ?? user.isAffiliatedWithOther ?? false,
    otherOrgName: rudc?.otherOrgName ?? user.otherOrgName ?? null,
    rudcTermsAccepted: rudc?.rudcTermsAccepted ?? user.rudcTermsAccepted ?? false,
    isRudcMember: rudc?.isRudcMember ?? user.isRudcMember ?? false,
    rudcMemberType: rudc?.rudcMemberType ?? user.rudcMemberType ?? null,
    rudcStatus: rudc?.rudcStatus ?? user.rudcStatus ?? null,
    rudcJoinedAt: rudc?.rudcJoinedAt ?? user.rudcJoinedAt ?? null,
    supervisorId: rudc?.supervisorId ?? user.supervisorId ?? null,
    supervisor: rudc?.supervisor ?? user.supervisor ?? null,
    interviewDate: rudc?.interviewDate ?? user.interviewDate ?? null,
    interviewNotes: rudc?.interviewNotes ?? user.interviewNotes ?? null,
    interviewEmailSentAt: rudc?.interviewEmailSentAt ?? user.interviewEmailSentAt ?? null,
  };
};

// 1. Volunteer Application
const applyForRudc = async (payload: TRudcApplyPayload, authenticatedUserId?: number) => {
  if (!payload.rudcTermsAccepted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You must accept all 10 RUDC terms and conditions to submit an application.'
    );
  }

  // Check if authenticated user is applying
  if (authenticatedUserId) {
    const existing = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
      include: { rudcProfile: true },
    });
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    const updated = await prisma.user.update({
      where: { id: authenticatedUserId },
      data: {
        department: payload.department,
        org: existing.org === Organization.RUIL ? Organization.BOTH : Organization.RUDC,
        rudcProfile: {
          upsert: {
            create: {
              faculty: payload.faculty,
              whatsappNumber: payload.whatsappNumber,
              bloodGroup: payload.bloodGroup,
              skills: payload.skills,
              accommodationType: payload.accommodationType,
              accommodationName: payload.accommodationName,
              permanentAddress: payload.permanentAddress,
              isAffiliatedWithOther: payload.isAffiliatedWithOther,
              otherOrgName: payload.isAffiliatedWithOther ? payload.otherOrgName : null,
              rudcTermsAccepted: true,
              isRudcMember: true,
              rudcMemberType: RudcMemberType.VOLUNTEER,
              rudcStatus: RudcApplicationStatus.PENDING_REVIEW,
              rudcJoinedAt: new Date(),
            },
            update: {
              faculty: payload.faculty,
              whatsappNumber: payload.whatsappNumber,
              bloodGroup: payload.bloodGroup,
              skills: payload.skills,
              accommodationType: payload.accommodationType,
              accommodationName: payload.accommodationName,
              permanentAddress: payload.permanentAddress,
              isAffiliatedWithOther: payload.isAffiliatedWithOther,
              otherOrgName: payload.isAffiliatedWithOther ? payload.otherOrgName : null,
              rudcTermsAccepted: true,
              isRudcMember: true,
              rudcMemberType: RudcMemberType.VOLUNTEER,
              rudcStatus: RudcApplicationStatus.PENDING_REVIEW,
              rudcJoinedAt: existing.rudcProfile?.rudcJoinedAt || new Date(),
            },
          },
        },
      },
      include: {
        rudcProfile: true,
      },
    });

    return formatUserWithRudcProfile(updated);
  }

  // If not authenticated, check if user exists by email, phone, or studentOrVoterId
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload.email },
        { phone: payload.phone },
        { studentOrVoterId: payload.studentOrVoterId },
      ],
    },
    include: { rudcProfile: true },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: payload.name || existingUser.name,
        department: payload.department,
        org: existingUser.org === Organization.RUIL ? Organization.BOTH : Organization.RUDC,
        rudcProfile: {
          upsert: {
            create: {
              faculty: payload.faculty,
              whatsappNumber: payload.whatsappNumber,
              bloodGroup: payload.bloodGroup,
              skills: payload.skills,
              accommodationType: payload.accommodationType,
              accommodationName: payload.accommodationName,
              permanentAddress: payload.permanentAddress,
              isAffiliatedWithOther: payload.isAffiliatedWithOther,
              otherOrgName: payload.isAffiliatedWithOther ? payload.otherOrgName : null,
              rudcTermsAccepted: true,
              isRudcMember: true,
              rudcMemberType: RudcMemberType.VOLUNTEER,
              rudcStatus: RudcApplicationStatus.PENDING_REVIEW,
              rudcJoinedAt: new Date(),
            },
            update: {
              faculty: payload.faculty,
              whatsappNumber: payload.whatsappNumber,
              bloodGroup: payload.bloodGroup,
              skills: payload.skills,
              accommodationType: payload.accommodationType,
              accommodationName: payload.accommodationName,
              permanentAddress: payload.permanentAddress,
              isAffiliatedWithOther: payload.isAffiliatedWithOther,
              otherOrgName: payload.isAffiliatedWithOther ? payload.otherOrgName : null,
              rudcTermsAccepted: true,
              isRudcMember: true,
              rudcMemberType: RudcMemberType.VOLUNTEER,
              rudcStatus: RudcApplicationStatus.PENDING_REVIEW,
              rudcJoinedAt: existingUser.rudcProfile?.rudcJoinedAt || new Date(),
            },
          },
        },
      },
      include: {
        rudcProfile: true,
      },
    });

    return formatUserWithRudcProfile(updated);
  }

  // Create new applicant user account
  const rawPass = payload.password || payload.phone;
  const hashedPassword = await hashPassword(rawPass, config.bcrypt_salt_rounds);

  const createdUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      studentOrVoterId: payload.studentOrVoterId,
      department: payload.department,
      org: Organization.RUDC,
      role: UserRole.MEMBER,
      status: UserStatus.PENDING_APPROVAL,
      isPaid: false,
      membershipStartedAt: null,
      membershipExpiresAt: null,
      paymentMethod: null,
      rudcProfile: {
        create: {
          faculty: payload.faculty,
          whatsappNumber: payload.whatsappNumber,
          bloodGroup: payload.bloodGroup,
          skills: payload.skills,
          accommodationType: payload.accommodationType,
          accommodationName: payload.accommodationName,
          permanentAddress: payload.permanentAddress,
          isAffiliatedWithOther: payload.isAffiliatedWithOther,
          otherOrgName: payload.isAffiliatedWithOther ? payload.otherOrgName : null,
          rudcTermsAccepted: true,
          isRudcMember: true,
          rudcMemberType: RudcMemberType.VOLUNTEER,
          rudcStatus: RudcApplicationStatus.PENDING_REVIEW,
          rudcJoinedAt: new Date(),
        },
      },
    },
    include: {
      rudcProfile: true,
    },
  });

  return formatUserWithRudcProfile(createdUser);
};

// 2. Fetch logged-in user's RUDC profile
const getMyRudcProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      rudcProfile: {
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              rudcProfile: {
                select: {
                  whatsappNumber: true,
                  rudcMemberType: true,
                },
              },
            },
          },
        },
      },
      supervisedMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              department: true,
              rudcProfile: {
                select: {
                  whatsappNumber: true,
                  rudcMemberType: true,
                  rudcStatus: true,
                  rudcJoinedAt: true,
                },
              },
            },
          },
        },
      },
      rudcTeams: {
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      department: true,
                      session: true,
                      avatarUrl: true,
                      rudcProfile: {
                        select: {
                          whatsappNumber: true,
                          faculty: true,
                          skills: true,
                          rudcMemberType: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      iyanotPayments: {
        include: {
          collectedBy: {
            select: {
              id: true,
              name: true,
              role: true,
              phone: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 24,
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const { password: _, ...userData } = user;
  return formatUserWithRudcProfile(userData);
};

// 3. Send Interview Notification Email
const sendInterviewEmail = async (payload: TSendInterviewEmailPayload) => {
  const { userIds, interviewDate, interviewTime, venueOrLink, instructions, subject } = payload;

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No matching users found to send interview notification.');
  }

  const formattedDate = new Date(interviewDate).toLocaleDateString('bn-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const emailSubject = subject || 'RUDC Volunteer Interview & Orientation Schedule';

  const sendPromises = users.map(async (u) => {
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fbf9; border: 1px solid #d4e8dd; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #004F32; margin: 0;">Rajshahi University Dawah Community (RUDC)</h2>
          <p style="color: #666; font-size: 13px; margin: 4px 0 0 0;">Campus-based Dawah & Social Khidmah Platform</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e1eee6;">
          <p style="font-size: 16px; color: #1e293b; margin-top: 0;">আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ, <strong>${u.name}</strong>,</p>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">
            RUDC-এ ভলান্টিয়ার হিসেবে আপনার আবেদন পর্যালোচনা করা হয়েছে। আমরা আপনার সাথে একটি প্রাথমিক আলোচনা ও পরিচিতি সেশনের আয়োজন করেছি।
          </p>
          <div style="background-color: #ecfdf5; border-left: 4px solid #004F32; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 4px 0; font-size: 14px; color: #064e3b;"><strong>তারিখ:</strong> ${formattedDate}</p>
            ${interviewTime ? `<p style="margin: 4px 0; font-size: 14px; color: #064e3b;"><strong>সময়:</strong> ${interviewTime}</p>` : ''}
            <p style="margin: 4px 0; font-size: 14px; color: #064e3b;"><strong>স্থান / লিংক:</strong> ${venueOrLink}</p>
          </div>
          ${
            instructions
              ? `<div style="margin-top: 14px; font-size: 13px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 6px;">
                  <strong>বিশেষ নির্দেশনা:</strong><br/>${instructions}
                 </div>`
              : ''
          }
          <p style="color: #475569; font-size: 13px; margin-top: 20px;">
            যথাসময়ে উপস্থিত থাকার জন্য অনুরোধ করা হলো। কোনো জিজ্ঞাসা থাকলে আমাদের সাথে যোগাযোগ করুন।
          </p>
          <p style="color: #004F32; font-weight: bold; margin-bottom: 0;">জাযাকুমুল্লাহু খায়রান,<br/>RUDC কোঅর্ডিনেশন টিম</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: u.email,
        subject: emailSubject,
        html: htmlBody,
      });

      await prisma.rudcMemberProfile.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          rudcStatus: RudcApplicationStatus.INTERVIEW_CALLED,
          interviewDate: new Date(interviewDate),
          interviewEmailSentAt: new Date(),
          interviewNotes: instructions || `Interview scheduled on ${formattedDate}`,
        },
        update: {
          rudcStatus: RudcApplicationStatus.INTERVIEW_CALLED,
          interviewDate: new Date(interviewDate),
          interviewEmailSentAt: new Date(),
          interviewNotes: instructions || `Interview scheduled on ${formattedDate}`,
        },
      });

      return { id: u.id, success: true };
    } catch {
      return { id: u.id, success: false };
    }
  });

  const results = await Promise.all(sendPromises);
  const successCount = results.filter((r) => r.success).length;

  return {
    total: users.length,
    successCount,
    failedCount: users.length - successCount,
  };
};

// 4. Get all RUDC Members & Applicants
const getAllRudcMembers = async (query: Record<string, unknown>) => {
  const {
    search,
    rudcMemberType,
    rudcStatus,
    supervisorId,
    teamId,
    org,
    page = 1,
    limit = 20,
  } = query;

  const take = Number(limit) || 20;
  const skip = (Number(page) - 1) * take;

  const whereConditions: any = {
    OR: [
      { rudcProfile: { isRudcMember: true } },
      { org: { in: [Organization.RUDC, Organization.BOTH] } },
    ],
  };

  if (org && org !== 'ALL') {
    if (org === 'RUDC') {
      whereConditions.org = { in: [Organization.RUDC, Organization.BOTH] };
    } else if (org === 'RUIL') {
      whereConditions.org = { in: [Organization.RUIL, Organization.BOTH] };
    } else {
      whereConditions.org = org as Organization;
    }
  }

  if (rudcMemberType && rudcMemberType !== 'ALL') {
    whereConditions.rudcProfile = {
      ...(whereConditions.rudcProfile || {}),
      rudcMemberType: rudcMemberType as RudcMemberType,
    };
  }

  if (rudcStatus && rudcStatus !== 'ALL') {
    whereConditions.rudcProfile = {
      ...(whereConditions.rudcProfile || {}),
      rudcStatus: rudcStatus as RudcApplicationStatus,
    };
  }

  if (supervisorId) {
    whereConditions.rudcProfile = {
      ...(whereConditions.rudcProfile || {}),
      supervisorId: Number(supervisorId),
    };
  }

  if (teamId) {
    whereConditions.rudcTeams = {
      some: { teamId: Number(teamId) },
    };
  }

  if (search) {
    const s = String(search).trim();
    whereConditions.AND = [
      {
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s, mode: 'insensitive' } },
          { studentOrVoterId: { contains: s, mode: 'insensitive' } },
          { department: { contains: s, mode: 'insensitive' } },
          { rudcProfile: { faculty: { contains: s, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  const [total, members] = await Promise.all([
    prisma.user.count({ where: whereConditions }),
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
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
        rudcTeams: {
          include: {
            team: true,
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
    data: members.map(formatUserWithRudcProfile),
  };
};

// 5. Get Single RUDC Member By ID
const getRudcMemberById = async (id: number) => {
  const member = await prisma.user.findUnique({
    where: { id },
    include: {
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
      supervisedMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              department: true,
            },
          },
        },
      },
      rudcTeams: {
        include: {
          team: true,
        },
      },
      iyanotPayments: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 24,
      },
    },
  });

  if (!member) {
    throw new AppError(httpStatus.NOT_FOUND, 'RUDC Member not found!');
  }

  const { password: _, ...sanitized } = member;
  return formatUserWithRudcProfile(sanitized);
};

// 6. Update Member Profile / Role / Supervisor
const updateRudcMember = async (id: number, payload: TUpdateRudcMemberPayload) => {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { rudcProfile: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Member not found!');
  }

  // If status is REJECTED, delete pure RUDC applicant from database or un-affiliate BOTH user
  if (payload.rudcStatus === RudcApplicationStatus.REJECTED) {
    if (existing.org === Organization.RUDC) {
      await prisma.rudcMemberProfile.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
      });
      await prisma.userRudcTeam.deleteMany({
        where: { userId: id },
      });
      await prisma.rudcIyanot.deleteMany({
        where: { userId: id },
      });
      await prisma.user.delete({
        where: { id },
      });
      return { id, isDeleted: true, message: 'Applicant rejected and record deleted from database successfully.' };
    } else {
      await prisma.userRudcTeam.deleteMany({
        where: { userId: id },
      });
      await prisma.rudcMemberProfile.deleteMany({
        where: { userId: id },
      });
      const updated = await prisma.user.update({
        where: { id },
        data: {
          org: Organization.RUIL,
        },
        include: { rudcProfile: true },
      });
      return formatUserWithRudcProfile(updated);
    }
  }

  if (payload.supervisorId && payload.supervisorId === id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'A member cannot be their own supervisor!');
  }

  const rudcUpdateData: Record<string, any> = {};
  if (payload.rudcMemberType !== undefined) rudcUpdateData.rudcMemberType = payload.rudcMemberType;
  if (payload.rudcStatus !== undefined) rudcUpdateData.rudcStatus = payload.rudcStatus;
  if (payload.supervisorId !== undefined) rudcUpdateData.supervisorId = payload.supervisorId;
  if (payload.faculty !== undefined) rudcUpdateData.faculty = payload.faculty;
  if (payload.whatsappNumber !== undefined) rudcUpdateData.whatsappNumber = payload.whatsappNumber;
  if (payload.bloodGroup !== undefined) rudcUpdateData.bloodGroup = payload.bloodGroup;
  if (payload.skills !== undefined) rudcUpdateData.skills = payload.skills;
  if (payload.accommodationType !== undefined) rudcUpdateData.accommodationType = payload.accommodationType;
  if (payload.accommodationName !== undefined) rudcUpdateData.accommodationName = payload.accommodationName;
  if (payload.permanentAddress !== undefined) rudcUpdateData.permanentAddress = payload.permanentAddress;
  if (payload.isAffiliatedWithOther !== undefined) rudcUpdateData.isAffiliatedWithOther = payload.isAffiliatedWithOther;
  if (payload.otherOrgName !== undefined) rudcUpdateData.otherOrgName = payload.isAffiliatedWithOther ? payload.otherOrgName : null;
  if (payload.interviewDate !== undefined) rudcUpdateData.interviewDate = payload.interviewDate ? new Date(payload.interviewDate) : null;
  if (payload.interviewNotes !== undefined) rudcUpdateData.interviewNotes = payload.interviewNotes;

  await prisma.user.update({
    where: { id },
    data: {
      ...(payload.department ? { department: payload.department } : {}),
      rudcProfile: {
        upsert: {
          create: {
            isRudcMember: true,
            rudcMemberType: payload.rudcMemberType || RudcMemberType.VOLUNTEER,
            rudcStatus: payload.rudcStatus || RudcApplicationStatus.PENDING_REVIEW,
            rudcJoinedAt: new Date(),
            ...rudcUpdateData,
          },
          update: rudcUpdateData,
        },
      },
    },
  });

  return getRudcMemberById(id);
};

// Dedicated delete / reject applicant endpoint
const deleteRudcMember = async (id: number) => {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { rudcProfile: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Member not found!');
  }

  await prisma.rudcMemberProfile.updateMany({
    where: { supervisorId: id },
    data: { supervisorId: null },
  });

  await prisma.userRudcTeam.deleteMany({
    where: { userId: id },
  });

  await prisma.rudcIyanot.deleteMany({
    where: { userId: id },
  });

  if (existing.org === Organization.RUDC) {
    await prisma.user.delete({
      where: { id },
    });
    return { id, isDeleted: true, message: 'Applicant/Member deleted completely from database.' };
  } else {
    await prisma.rudcMemberProfile.deleteMany({
      where: { userId: id },
    });
    const updated = await prisma.user.update({
      where: { id },
      data: {
        org: Organization.RUIL,
      },
      include: { rudcProfile: true },
    });
    return { id, isDeleted: false, message: 'RUDC association removed; library user preserved.', data: formatUserWithRudcProfile(updated) };
  }
};

// 7. Pre-existed RUDC Member Entry with ALL Recruitment Fields
const createPreExistedRudcMember = async (payload: TCreatePreExistedRudcMemberPayload) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload.email },
        { phone: payload.phone },
        { studentOrVoterId: payload.studentOrVoterId },
      ],
    },
    include: { rudcProfile: true },
  });

  let userId: number;
  const targetOrg = payload.org || Organization.RUDC;

  const rudcProfileData = {
    faculty: payload.faculty,
    whatsappNumber: payload.whatsappNumber,
    bloodGroup: payload.bloodGroup,
    skills: payload.skills || [],
    accommodationType: payload.accommodationType,
    accommodationName: payload.accommodationName,
    permanentAddress: payload.permanentAddress,
    isAffiliatedWithOther: payload.isAffiliatedWithOther || false,
    otherOrgName: payload.otherOrgName || null,
    isRudcMember: true,
    rudcMemberType: payload.rudcMemberType || RudcMemberType.MEMBER,
    rudcStatus: payload.rudcStatus || RudcApplicationStatus.APPROVED,
    supervisorId: payload.supervisorId || null,
    rudcJoinedAt: payload.rudcJoinedAt ? new Date(payload.rudcJoinedAt) : new Date(),
    rudcTermsAccepted: true,
  };

  if (existingUser) {
    userId = existingUser.id;
    const combinedOrg =
      existingUser.org === Organization.RUIL && targetOrg === Organization.RUDC
        ? Organization.BOTH
        : targetOrg;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: payload.name || existingUser.name,
        department: payload.department || existingUser.department,
        session: payload.session || existingUser.session,
        institution: payload.institution || existingUser.institution,
        org: combinedOrg,
        rudcProfile: {
          upsert: {
            create: rudcProfileData,
            update: rudcProfileData,
          },
        },
      },
    });
  } else {
    const rawPass = payload.password || payload.phone;
    const hashedPassword = await hashPassword(rawPass, config.bcrypt_salt_rounds);

    const created = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: hashedPassword,
        studentOrVoterId: payload.studentOrVoterId,
        department: payload.department,
        session: payload.session,
        institution: payload.institution,
        org: targetOrg,
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        rudcProfile: {
          create: rudcProfileData,
        },
      },
    });
    userId = created.id;
  }

  // Link to teams if provided
  if (payload.teamIds && payload.teamIds.length > 0) {
    for (const teamId of payload.teamIds) {
      await prisma.userRudcTeam.upsert({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
        create: {
          userId,
          teamId,
          role: 'MEMBER',
        },
        update: {},
      });
    }
  }

  return getRudcMemberById(userId);
};

// 8. Public Stats for RUDC Landing Page
const getPublicRudcStats = async () => {
  const [volunteersCount, permanentMembersCount, totalMembers, teamsCount, iyanotAgg] =
    await Promise.all([
      prisma.rudcMemberProfile.count({
        where: {
          isRudcMember: true,
          rudcMemberType: RudcMemberType.VOLUNTEER,
          rudcStatus: RudcApplicationStatus.APPROVED,
        },
      }),
      prisma.rudcMemberProfile.count({
        where: {
          isRudcMember: true,
          rudcMemberType: {
            in: [
              RudcMemberType.MEMBER,
              RudcMemberType.EXECUTIVE_COMMITTEE,
              RudcMemberType.SHURA_MEMBER,
            ],
          },
        },
      }),
      prisma.rudcMemberProfile.count({
        where: {
          isRudcMember: true,
        },
      }),
      prisma.rudcTeam.count(),
      prisma.rudcIyanot.aggregate({
        _sum: { amount: true },
      }),
    ]);

  return {
    volunteersCount,
    permanentMembersCount,
    totalMembers,
    teamsCount,
    iyanotTotal: iyanotAgg._sum.amount || 0,
  };
};

export const RudcMemberService = {
  applyForRudc,
  getMyRudcProfile,
  sendInterviewEmail,
  getAllRudcMembers,
  getRudcMemberById,
  updateRudcMember,
  deleteRudcMember,
  createPreExistedRudcMember,
  getPublicRudcStats,
};

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcMemberService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const config_1 = __importDefault(require("../../config"));
const passwordHelpers_1 = require("../../utils/passwordHelpers");
const emailSender_1 = __importDefault(require("../../utils/emailSender"));
// 1. Volunteer Application
const applyForRudc = (payload, authenticatedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.rudcTermsAccepted) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You must accept all 10 RUDC terms and conditions to submit an application.');
    }
    // Check if authenticated user is applying
    if (authenticatedUserId) {
        const existing = yield db_1.default.user.findUnique({
            where: { id: authenticatedUserId },
        });
        if (!existing) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
        }
        const updated = yield db_1.default.user.update({
            where: { id: authenticatedUserId },
            data: {
                department: payload.department,
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
                org: existing.org === client_1.Organization.RUIL ? client_1.Organization.BOTH : client_1.Organization.RUDC,
                rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                rudcJoinedAt: new Date(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                org: true,
                rudcStatus: true,
                rudcMemberType: true,
                isRudcMember: true,
            },
        });
        return updated;
    }
    // If not authenticated, check if user exists by email, phone, or studentOrVoterId
    const existingUser = yield db_1.default.user.findFirst({
        where: {
            OR: [
                { email: payload.email },
                { phone: payload.phone },
                { studentOrVoterId: payload.studentOrVoterId },
            ],
        },
    });
    if (existingUser) {
        const updated = yield db_1.default.user.update({
            where: { id: existingUser.id },
            data: {
                name: payload.name || existingUser.name,
                department: payload.department,
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
                org: existingUser.org === client_1.Organization.RUIL ? client_1.Organization.BOTH : client_1.Organization.RUDC,
                rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                rudcJoinedAt: existingUser.rudcJoinedAt || new Date(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                org: true,
                rudcStatus: true,
                rudcMemberType: true,
                isRudcMember: true,
            },
        });
        return updated;
    }
    // Create new applicant user account
    const rawPass = payload.password || payload.phone;
    const hashedPassword = yield (0, passwordHelpers_1.hashPassword)(rawPass, config_1.default.bcrypt_salt_rounds);
    const createdUser = yield db_1.default.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            password: hashedPassword,
            studentOrVoterId: payload.studentOrVoterId,
            department: payload.department,
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
            org: client_1.Organization.RUDC,
            rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
            rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
            rudcJoinedAt: new Date(),
            role: client_1.UserRole.MEMBER,
            status: client_1.UserStatus.ACTIVE,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            org: true,
            rudcStatus: true,
            rudcMemberType: true,
            isRudcMember: true,
        },
    });
    return createdUser;
});
// 2. Fetch logged-in user's RUDC profile
const getMyRudcProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
        include: {
            supervisor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    rudcMemberType: true,
                },
            },
            supervisedVolunteers: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    department: true,
                    rudcMemberType: true,
                    rudcStatus: true,
                    rudcJoinedAt: true,
                },
            },
            rudcTeams: {
                include: {
                    team: true,
                },
            },
            iyanotPayments: {
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
                take: 12,
            },
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const { password: _ } = user, userData = __rest(user, ["password"]);
    return userData;
});
// 3. Send Interview Notification Email
const sendInterviewEmail = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, interviewDate, interviewTime, venueOrLink, instructions, subject } = payload;
    const users = yield db_1.default.user.findMany({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No matching users found to send interview notification.');
    }
    const formattedDate = new Date(interviewDate).toLocaleDateString('bn-BD', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const emailSubject = subject || 'RUDC Volunteer Interview & Orientation Schedule';
    const sendPromises = users.map((u) => __awaiter(void 0, void 0, void 0, function* () {
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
          ${instructions
            ? `<div style="margin-top: 14px; font-size: 13px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 6px;">
                  <strong>বিশেষ নির্দেশনা:</strong><br/>${instructions}
                 </div>`
            : ''}
          <p style="color: #475569; font-size: 13px; margin-top: 20px;">
            যথাসময়ে উপস্থিত থাকার জন্য অনুরোধ করা হলো। কোনো জিজ্ঞাসা থাকলে আমাদের সাথে যোগাযোগ করুন।
          </p>
          <p style="color: #004F32; font-weight: bold; margin-bottom: 0;">জাযাকুমুল্লাহু খায়রান,<br/>RUDC কোঅর্ডিনেশন টিম</p>
        </div>
      </div>
    `;
        try {
            yield (0, emailSender_1.default)({
                to: u.email,
                subject: emailSubject,
                html: htmlBody,
            });
            yield db_1.default.user.update({
                where: { id: u.id },
                data: {
                    rudcStatus: client_1.RudcApplicationStatus.INTERVIEW_CALLED,
                    interviewDate: new Date(interviewDate),
                    interviewEmailSentAt: new Date(),
                    interviewNotes: instructions || `Interview scheduled on ${formattedDate}`,
                },
            });
            return { id: u.id, success: true };
        }
        catch (_a) {
            return { id: u.id, success: false };
        }
    }));
    const results = yield Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;
    return {
        total: users.length,
        successCount,
        failedCount: users.length - successCount,
    };
});
// 4. Get all RUDC Members & Applicants
const getAllRudcMembers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, rudcMemberType, rudcStatus, supervisorId, teamId, org, page = 1, limit = 20, } = query;
    const take = Number(limit) || 20;
    const skip = (Number(page) - 1) * take;
    const whereConditions = {
        OR: [
            { isRudcMember: true },
            { org: { in: [client_1.Organization.RUDC, client_1.Organization.BOTH] } },
        ],
    };
    if (org && org !== 'ALL') {
        if (org === 'RUDC') {
            whereConditions.org = { in: [client_1.Organization.RUDC, client_1.Organization.BOTH] };
        }
        else if (org === 'RUIL') {
            whereConditions.org = { in: [client_1.Organization.RUIL, client_1.Organization.BOTH] };
        }
        else {
            whereConditions.org = org;
        }
    }
    if (rudcMemberType && rudcMemberType !== 'ALL') {
        whereConditions.rudcMemberType = rudcMemberType;
    }
    if (rudcStatus && rudcStatus !== 'ALL') {
        whereConditions.rudcStatus = rudcStatus;
    }
    if (supervisorId) {
        whereConditions.supervisorId = Number(supervisorId);
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
                    { faculty: { contains: s, mode: 'insensitive' } },
                ],
            },
        ];
    }
    const [total, members] = yield Promise.all([
        db_1.default.user.count({ where: whereConditions }),
        db_1.default.user.findMany({
            where: whereConditions,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                studentOrVoterId: true,
                department: true,
                faculty: true,
                session: true,
                institution: true,
                whatsappNumber: true,
                bloodGroup: true,
                skills: true,
                accommodationType: true,
                accommodationName: true,
                permanentAddress: true,
                isAffiliatedWithOther: true,
                otherOrgName: true,
                org: true,
                isRudcMember: true,
                rudcMemberType: true,
                rudcStatus: true,
                rudcJoinedAt: true,
                supervisorId: true,
                supervisor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        rudcMemberType: true,
                    },
                },
                rudcTeams: {
                    include: {
                        team: true,
                    },
                },
                interviewDate: true,
                interviewNotes: true,
                interviewEmailSentAt: true,
                createdAt: true,
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
        data: members,
    };
});
// 5. Get Single RUDC Member By ID
const getRudcMemberById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const member = yield db_1.default.user.findUnique({
        where: { id },
        include: {
            supervisor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    rudcMemberType: true,
                },
            },
            supervisedVolunteers: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    department: true,
                    rudcMemberType: true,
                    rudcStatus: true,
                    rudcJoinedAt: true,
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'RUDC Member not found!');
    }
    const { password: _ } = member, sanitized = __rest(member, ["password"]);
    return sanitized;
});
// 6. Update Member Profile / Role / Supervisor
const updateRudcMember = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.user.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Member not found!');
    }
    if (payload.supervisorId && payload.supervisorId === id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A member cannot be their own supervisor!');
    }
    const updated = yield db_1.default.user.update({
        where: { id },
        data: {
            rudcMemberType: payload.rudcMemberType,
            rudcStatus: payload.rudcStatus,
            supervisorId: payload.supervisorId !== undefined ? payload.supervisorId : undefined,
            department: payload.department,
            faculty: payload.faculty,
            whatsappNumber: payload.whatsappNumber,
            bloodGroup: payload.bloodGroup,
            skills: payload.skills,
            accommodationType: payload.accommodationType,
            accommodationName: payload.accommodationName,
            permanentAddress: payload.permanentAddress,
            isAffiliatedWithOther: payload.isAffiliatedWithOther,
            otherOrgName: payload.isAffiliatedWithOther ? payload.otherOrgName : null,
            interviewDate: payload.interviewDate ? new Date(payload.interviewDate) : undefined,
            interviewNotes: payload.interviewNotes !== undefined ? payload.interviewNotes : undefined,
        },
    });
    return getRudcMemberById(updated.id);
});
// 7. Pre-existed RUDC Member Entry with ALL Recruitment Fields
const createPreExistedRudcMember = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield db_1.default.user.findFirst({
        where: {
            OR: [
                { email: payload.email },
                { phone: payload.phone },
                { studentOrVoterId: payload.studentOrVoterId },
            ],
        },
    });
    let userId;
    const targetOrg = payload.org || client_1.Organization.RUDC;
    if (existingUser) {
        userId = existingUser.id;
        const combinedOrg = existingUser.org === client_1.Organization.RUIL && targetOrg === client_1.Organization.RUDC
            ? client_1.Organization.BOTH
            : targetOrg;
        yield db_1.default.user.update({
            where: { id: userId },
            data: {
                name: payload.name || existingUser.name,
                department: payload.department || existingUser.department,
                faculty: payload.faculty || existingUser.faculty,
                session: payload.session || existingUser.session,
                institution: payload.institution || existingUser.institution,
                whatsappNumber: payload.whatsappNumber || existingUser.whatsappNumber,
                bloodGroup: payload.bloodGroup || existingUser.bloodGroup,
                skills: payload.skills && payload.skills.length > 0 ? payload.skills : existingUser.skills,
                accommodationType: payload.accommodationType || existingUser.accommodationType,
                accommodationName: payload.accommodationName || existingUser.accommodationName,
                permanentAddress: payload.permanentAddress || existingUser.permanentAddress,
                isAffiliatedWithOther: payload.isAffiliatedWithOther !== undefined
                    ? payload.isAffiliatedWithOther
                    : existingUser.isAffiliatedWithOther,
                otherOrgName: payload.otherOrgName !== undefined ? payload.otherOrgName : existingUser.otherOrgName,
                isRudcMember: true,
                org: combinedOrg,
                rudcMemberType: payload.rudcMemberType || client_1.RudcMemberType.MEMBER,
                rudcStatus: payload.rudcStatus || client_1.RudcApplicationStatus.APPROVED,
                supervisorId: payload.supervisorId !== undefined ? payload.supervisorId : existingUser.supervisorId,
                rudcJoinedAt: payload.rudcJoinedAt ? new Date(payload.rudcJoinedAt) : existingUser.rudcJoinedAt || new Date(),
                rudcTermsAccepted: true,
            },
        });
    }
    else {
        const rawPass = payload.password || payload.phone;
        const hashedPassword = yield (0, passwordHelpers_1.hashPassword)(rawPass, config_1.default.bcrypt_salt_rounds);
        const created = yield db_1.default.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                password: hashedPassword,
                studentOrVoterId: payload.studentOrVoterId,
                department: payload.department,
                faculty: payload.faculty,
                session: payload.session,
                institution: payload.institution,
                whatsappNumber: payload.whatsappNumber,
                bloodGroup: payload.bloodGroup,
                skills: payload.skills || [],
                accommodationType: payload.accommodationType,
                accommodationName: payload.accommodationName,
                permanentAddress: payload.permanentAddress,
                isAffiliatedWithOther: payload.isAffiliatedWithOther || false,
                otherOrgName: payload.otherOrgName || null,
                isRudcMember: true,
                org: targetOrg,
                rudcMemberType: payload.rudcMemberType || client_1.RudcMemberType.MEMBER,
                rudcStatus: payload.rudcStatus || client_1.RudcApplicationStatus.APPROVED,
                supervisorId: payload.supervisorId,
                rudcJoinedAt: payload.rudcJoinedAt ? new Date(payload.rudcJoinedAt) : new Date(),
                rudcTermsAccepted: true,
                role: client_1.UserRole.MEMBER,
                status: client_1.UserStatus.ACTIVE,
            },
        });
        userId = created.id;
    }
    // Link to teams if provided
    if (payload.teamIds && payload.teamIds.length > 0) {
        for (const teamId of payload.teamIds) {
            yield db_1.default.userRudcTeam.upsert({
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
});
// 8. Public Stats for RUDC Landing Page
const getPublicRudcStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [volunteersCount, permanentMembersCount, totalMembers, teamsCount, iyanotAgg] = yield Promise.all([
        db_1.default.user.count({
            where: {
                isRudcMember: true,
                rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                rudcStatus: client_1.RudcApplicationStatus.APPROVED,
            },
        }),
        db_1.default.user.count({
            where: {
                isRudcMember: true,
                rudcMemberType: {
                    in: [
                        client_1.RudcMemberType.MEMBER,
                        client_1.RudcMemberType.EXECUTIVE_COMMITTEE,
                        client_1.RudcMemberType.SHURA_MEMBER,
                    ],
                },
            },
        }),
        db_1.default.user.count({
            where: {
                isRudcMember: true,
            },
        }),
        db_1.default.rudcTeam.count(),
        db_1.default.rudcIyanot.aggregate({
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
});
exports.RudcMemberService = {
    applyForRudc,
    getMyRudcProfile,
    sendInterviewEmail,
    getAllRudcMembers,
    getRudcMemberById,
    updateRudcMember,
    createPreExistedRudcMember,
    getPublicRudcStats,
};

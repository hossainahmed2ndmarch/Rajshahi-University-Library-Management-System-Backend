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
exports.RudcMemberService = exports.formatUserWithRudcProfile = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const config_1 = __importDefault(require("../../config"));
const passwordHelpers_1 = require("../../utils/passwordHelpers");
const emailSender_1 = __importDefault(require("../../utils/emailSender"));
/**
 * Normalization helper: formats a User record with their 1:1 RudcMemberProfile
 * so both nested (user.rudcProfile) and flat properties (user.whatsappNumber, user.rudcStatus)
 * remain 100% backward compatible for all existing API clients.
 */
const formatUserWithRudcProfile = (user) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
    if (!user)
        return user;
    const rudc = user.rudcProfile;
    return Object.assign(Object.assign({}, user), { rudcProfile: rudc || null, 
        // Flattened aliases for backward compatibility with frontend
        faculty: (_b = (_a = rudc === null || rudc === void 0 ? void 0 : rudc.faculty) !== null && _a !== void 0 ? _a : user.faculty) !== null && _b !== void 0 ? _b : null, whatsappNumber: (_d = (_c = rudc === null || rudc === void 0 ? void 0 : rudc.whatsappNumber) !== null && _c !== void 0 ? _c : user.whatsappNumber) !== null && _d !== void 0 ? _d : null, bloodGroup: (_f = (_e = rudc === null || rudc === void 0 ? void 0 : rudc.bloodGroup) !== null && _e !== void 0 ? _e : user.bloodGroup) !== null && _f !== void 0 ? _f : null, skills: (_g = rudc === null || rudc === void 0 ? void 0 : rudc.skills) !== null && _g !== void 0 ? _g : (Array.isArray(user.skills) ? user.skills : []), accommodationType: (_j = (_h = rudc === null || rudc === void 0 ? void 0 : rudc.accommodationType) !== null && _h !== void 0 ? _h : user.accommodationType) !== null && _j !== void 0 ? _j : null, accommodationName: (_l = (_k = rudc === null || rudc === void 0 ? void 0 : rudc.accommodationName) !== null && _k !== void 0 ? _k : user.accommodationName) !== null && _l !== void 0 ? _l : null, permanentAddress: (_o = (_m = rudc === null || rudc === void 0 ? void 0 : rudc.permanentAddress) !== null && _m !== void 0 ? _m : user.permanentAddress) !== null && _o !== void 0 ? _o : null, isAffiliatedWithOther: (_q = (_p = rudc === null || rudc === void 0 ? void 0 : rudc.isAffiliatedWithOther) !== null && _p !== void 0 ? _p : user.isAffiliatedWithOther) !== null && _q !== void 0 ? _q : false, otherOrgName: (_s = (_r = rudc === null || rudc === void 0 ? void 0 : rudc.otherOrgName) !== null && _r !== void 0 ? _r : user.otherOrgName) !== null && _s !== void 0 ? _s : null, rudcTermsAccepted: (_u = (_t = rudc === null || rudc === void 0 ? void 0 : rudc.rudcTermsAccepted) !== null && _t !== void 0 ? _t : user.rudcTermsAccepted) !== null && _u !== void 0 ? _u : false, isRudcMember: (_w = (_v = rudc === null || rudc === void 0 ? void 0 : rudc.isRudcMember) !== null && _v !== void 0 ? _v : user.isRudcMember) !== null && _w !== void 0 ? _w : false, rudcMemberType: (_y = (_x = rudc === null || rudc === void 0 ? void 0 : rudc.rudcMemberType) !== null && _x !== void 0 ? _x : user.rudcMemberType) !== null && _y !== void 0 ? _y : null, rudcStatus: (_0 = (_z = rudc === null || rudc === void 0 ? void 0 : rudc.rudcStatus) !== null && _z !== void 0 ? _z : user.rudcStatus) !== null && _0 !== void 0 ? _0 : null, rudcJoinedAt: (_2 = (_1 = rudc === null || rudc === void 0 ? void 0 : rudc.rudcJoinedAt) !== null && _1 !== void 0 ? _1 : user.rudcJoinedAt) !== null && _2 !== void 0 ? _2 : null, supervisorId: (_4 = (_3 = rudc === null || rudc === void 0 ? void 0 : rudc.supervisorId) !== null && _3 !== void 0 ? _3 : user.supervisorId) !== null && _4 !== void 0 ? _4 : null, supervisor: (_6 = (_5 = rudc === null || rudc === void 0 ? void 0 : rudc.supervisor) !== null && _5 !== void 0 ? _5 : user.supervisor) !== null && _6 !== void 0 ? _6 : null, interviewDate: (_8 = (_7 = rudc === null || rudc === void 0 ? void 0 : rudc.interviewDate) !== null && _7 !== void 0 ? _7 : user.interviewDate) !== null && _8 !== void 0 ? _8 : null, interviewNotes: (_10 = (_9 = rudc === null || rudc === void 0 ? void 0 : rudc.interviewNotes) !== null && _9 !== void 0 ? _9 : user.interviewNotes) !== null && _10 !== void 0 ? _10 : null, interviewEmailSentAt: (_12 = (_11 = rudc === null || rudc === void 0 ? void 0 : rudc.interviewEmailSentAt) !== null && _11 !== void 0 ? _11 : user.interviewEmailSentAt) !== null && _12 !== void 0 ? _12 : null });
};
exports.formatUserWithRudcProfile = formatUserWithRudcProfile;
// 1. Volunteer Application
const applyForRudc = (payload, authenticatedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!payload.rudcTermsAccepted) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You must accept all 10 RUDC terms and conditions to submit an application.');
    }
    // Check if authenticated user is applying
    if (authenticatedUserId) {
        const existing = yield db_1.default.user.findUnique({
            where: { id: authenticatedUserId },
            include: { rudcProfile: true },
        });
        if (!existing) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
        }
        const updated = yield db_1.default.user.update({
            where: { id: authenticatedUserId },
            data: {
                department: payload.department,
                org: existing.org === client_1.Organization.RUIL ? client_1.Organization.BOTH : client_1.Organization.RUDC,
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
                            rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                            rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
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
                            rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                            rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                            rudcJoinedAt: ((_a = existing.rudcProfile) === null || _a === void 0 ? void 0 : _a.rudcJoinedAt) || new Date(),
                        },
                    },
                },
            },
            include: {
                rudcProfile: true,
            },
        });
        return (0, exports.formatUserWithRudcProfile)(updated);
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
        include: { rudcProfile: true },
    });
    if (existingUser) {
        const updated = yield db_1.default.user.update({
            where: { id: existingUser.id },
            data: {
                name: payload.name || existingUser.name,
                department: payload.department,
                org: existingUser.org === client_1.Organization.RUIL ? client_1.Organization.BOTH : client_1.Organization.RUDC,
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
                            rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                            rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
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
                            rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                            rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                            rudcJoinedAt: ((_b = existingUser.rudcProfile) === null || _b === void 0 ? void 0 : _b.rudcJoinedAt) || new Date(),
                        },
                    },
                },
            },
            include: {
                rudcProfile: true,
            },
        });
        return (0, exports.formatUserWithRudcProfile)(updated);
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
            org: client_1.Organization.RUDC,
            role: client_1.UserRole.MEMBER,
            // RUDC-only applicants start as INACTIVE — they are NOT RUIL members.
            // They can still log in and view their RUDC application status in the
            // dashboard. Admin approval makes them a RUDC volunteer but does NOT
            // activate RUIL membership.
            status: client_1.UserStatus.INACTIVE,
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
                    rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                    rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                    rudcJoinedAt: new Date(),
                },
            },
        },
        include: {
            rudcProfile: true,
        },
    });
    return (0, exports.formatUserWithRudcProfile)(createdUser);
});
// 2. Fetch logged-in user's RUDC profile
const getMyRudcProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const { password: _ } = user, userData = __rest(user, ["password"]);
    return (0, exports.formatUserWithRudcProfile)(userData);
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
            yield db_1.default.rudcMemberProfile.upsert({
                where: { userId: u.id },
                create: {
                    userId: u.id,
                    rudcStatus: client_1.RudcApplicationStatus.INTERVIEW_CALLED,
                    interviewDate: new Date(interviewDate),
                    interviewEmailSentAt: new Date(),
                    interviewNotes: instructions || `Interview scheduled on ${formattedDate}`,
                },
                update: {
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
            { rudcProfile: { isRudcMember: true } },
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
        whereConditions.rudcProfile = Object.assign(Object.assign({}, (whereConditions.rudcProfile || {})), { rudcMemberType: rudcMemberType });
    }
    if (rudcStatus && rudcStatus !== 'ALL') {
        whereConditions.rudcProfile = Object.assign(Object.assign({}, (whereConditions.rudcProfile || {})), { rudcStatus: rudcStatus });
    }
    if (supervisorId) {
        whereConditions.rudcProfile = Object.assign(Object.assign({}, (whereConditions.rudcProfile || {})), { supervisorId: Number(supervisorId) });
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
    const [total, members] = yield Promise.all([
        db_1.default.user.count({ where: whereConditions }),
        db_1.default.user.findMany({
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
        data: members.map(exports.formatUserWithRudcProfile),
    };
});
// 5. Get Single RUDC Member By ID
const getRudcMemberById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const member = yield db_1.default.user.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'RUDC Member not found!');
    }
    const { password: _ } = member, sanitized = __rest(member, ["password"]);
    return (0, exports.formatUserWithRudcProfile)(sanitized);
});
// 6. Update Member Profile / Role / Supervisor
const updateRudcMember = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.user.findUnique({
        where: { id },
        include: { rudcProfile: true },
    });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Member not found!');
    }
    // If status is REJECTED, delete pure RUDC applicant from database or un-affiliate BOTH user
    if (payload.rudcStatus === client_1.RudcApplicationStatus.REJECTED) {
        if (existing.org === client_1.Organization.RUDC) {
            yield db_1.default.rudcMemberProfile.updateMany({
                where: { supervisorId: id },
                data: { supervisorId: null },
            });
            yield db_1.default.userRudcTeam.deleteMany({
                where: { userId: id },
            });
            yield db_1.default.rudcIyanot.deleteMany({
                where: { userId: id },
            });
            yield db_1.default.user.delete({
                where: { id },
            });
            return { id, isDeleted: true, message: 'Applicant rejected and record deleted from database successfully.' };
        }
        else {
            yield db_1.default.userRudcTeam.deleteMany({
                where: { userId: id },
            });
            yield db_1.default.rudcMemberProfile.deleteMany({
                where: { userId: id },
            });
            const updated = yield db_1.default.user.update({
                where: { id },
                data: {
                    org: client_1.Organization.RUIL,
                },
                include: { rudcProfile: true },
            });
            return (0, exports.formatUserWithRudcProfile)(updated);
        }
    }
    if (payload.supervisorId && payload.supervisorId === id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A member cannot be their own supervisor!');
    }
    const rudcUpdateData = {};
    if (payload.rudcMemberType !== undefined)
        rudcUpdateData.rudcMemberType = payload.rudcMemberType;
    if (payload.rudcStatus !== undefined)
        rudcUpdateData.rudcStatus = payload.rudcStatus;
    if (payload.supervisorId !== undefined)
        rudcUpdateData.supervisorId = payload.supervisorId;
    if (payload.faculty !== undefined)
        rudcUpdateData.faculty = payload.faculty;
    if (payload.whatsappNumber !== undefined)
        rudcUpdateData.whatsappNumber = payload.whatsappNumber;
    if (payload.bloodGroup !== undefined)
        rudcUpdateData.bloodGroup = payload.bloodGroup;
    if (payload.skills !== undefined)
        rudcUpdateData.skills = payload.skills;
    if (payload.accommodationType !== undefined)
        rudcUpdateData.accommodationType = payload.accommodationType;
    if (payload.accommodationName !== undefined)
        rudcUpdateData.accommodationName = payload.accommodationName;
    if (payload.permanentAddress !== undefined)
        rudcUpdateData.permanentAddress = payload.permanentAddress;
    if (payload.isAffiliatedWithOther !== undefined)
        rudcUpdateData.isAffiliatedWithOther = payload.isAffiliatedWithOther;
    if (payload.otherOrgName !== undefined)
        rudcUpdateData.otherOrgName = payload.isAffiliatedWithOther ? payload.otherOrgName : null;
    if (payload.interviewDate !== undefined)
        rudcUpdateData.interviewDate = payload.interviewDate ? new Date(payload.interviewDate) : null;
    if (payload.interviewNotes !== undefined)
        rudcUpdateData.interviewNotes = payload.interviewNotes;
    yield db_1.default.user.update({
        where: { id },
        data: Object.assign(Object.assign({}, (payload.department ? { department: payload.department } : {})), { rudcProfile: {
                upsert: {
                    create: Object.assign({ isRudcMember: true, rudcMemberType: payload.rudcMemberType || client_1.RudcMemberType.VOLUNTEER, rudcStatus: payload.rudcStatus || client_1.RudcApplicationStatus.PENDING_REVIEW, rudcJoinedAt: new Date() }, rudcUpdateData),
                    update: rudcUpdateData,
                },
            } }),
    });
    return getRudcMemberById(id);
});
// Dedicated delete / reject applicant endpoint
const deleteRudcMember = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.user.findUnique({
        where: { id },
        include: { rudcProfile: true },
    });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Member not found!');
    }
    yield db_1.default.rudcMemberProfile.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
    });
    yield db_1.default.userRudcTeam.deleteMany({
        where: { userId: id },
    });
    yield db_1.default.rudcIyanot.deleteMany({
        where: { userId: id },
    });
    if (existing.org === client_1.Organization.RUDC) {
        yield db_1.default.user.delete({
            where: { id },
        });
        return { id, isDeleted: true, message: 'Applicant/Member deleted completely from database.' };
    }
    else {
        yield db_1.default.rudcMemberProfile.deleteMany({
            where: { userId: id },
        });
        const updated = yield db_1.default.user.update({
            where: { id },
            data: {
                org: client_1.Organization.RUIL,
            },
            include: { rudcProfile: true },
        });
        return { id, isDeleted: false, message: 'RUDC association removed; library user preserved.', data: (0, exports.formatUserWithRudcProfile)(updated) };
    }
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
        include: { rudcProfile: true },
    });
    let userId;
    const targetOrg = payload.org || client_1.Organization.RUDC;
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
        rudcMemberType: payload.rudcMemberType || client_1.RudcMemberType.MEMBER,
        rudcStatus: payload.rudcStatus || client_1.RudcApplicationStatus.APPROVED,
        supervisorId: payload.supervisorId || null,
        rudcJoinedAt: payload.rudcJoinedAt ? new Date(payload.rudcJoinedAt) : new Date(),
        rudcTermsAccepted: true,
    };
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
                session: payload.session,
                institution: payload.institution,
                org: targetOrg,
                role: client_1.UserRole.MEMBER,
                status: client_1.UserStatus.ACTIVE,
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
        db_1.default.rudcMemberProfile.count({
            where: {
                isRudcMember: true,
                rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                rudcStatus: client_1.RudcApplicationStatus.APPROVED,
            },
        }),
        db_1.default.rudcMemberProfile.count({
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
        db_1.default.rudcMemberProfile.count({
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
    deleteRudcMember,
    createPreExistedRudcMember,
    getPublicRudcStats,
};

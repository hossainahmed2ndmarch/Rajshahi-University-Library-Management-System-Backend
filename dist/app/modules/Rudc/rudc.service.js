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
exports.RudcService = void 0;
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
                rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
                rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                rudcJoinedAt: new Date(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
        // If user already exists, update their profile with RUDC application
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
                rudcMemberType: existingUser.rudcMemberType || client_1.RudcMemberType.VOLUNTEER,
                rudcStatus: client_1.RudcApplicationStatus.PENDING_REVIEW,
                rudcJoinedAt: existingUser.rudcJoinedAt || new Date(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                rudcStatus: true,
                rudcMemberType: true,
                isRudcMember: true,
            },
        });
        return updated;
    }
    // Register new user and RUDC volunteer
    const userPassword = payload.password || payload.phone; // Fallback to phone if password not specified
    const hashedPassword = yield (0, passwordHelpers_1.hashPassword)(userPassword, config_1.default.bcrypt_salt_rounds);
    const newUser = yield db_1.default.user.create({
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
            rudcStatus: true,
            rudcMemberType: true,
            isRudcMember: true,
        },
    });
    return newUser;
});
// 2. Get All RUDC Members with Advanced Filtering & Pagination
const getAllRudcMembers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const whereConditions = {
        isRudcMember: true,
    };
    if (query.rudcStatus) {
        whereConditions.rudcStatus = query.rudcStatus;
    }
    if (query.rudcMemberType) {
        whereConditions.rudcMemberType = query.rudcMemberType;
    }
    if (query.supervisorId) {
        whereConditions.supervisorId = Number(query.supervisorId);
    }
    if (query.bloodGroup) {
        whereConditions.bloodGroup = query.bloodGroup;
    }
    if (query.department) {
        whereConditions.department = { contains: String(query.department), mode: 'insensitive' };
    }
    if (query.teamId) {
        whereConditions.rudcTeams = {
            some: {
                teamId: Number(query.teamId),
            },
        };
    }
    if (query.searchTerm) {
        const term = String(query.searchTerm);
        whereConditions.OR = [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term, mode: 'insensitive' } },
            { studentOrVoterId: { contains: term, mode: 'insensitive' } },
            { department: { contains: term, mode: 'insensitive' } },
            { whatsappNumber: { contains: term, mode: 'insensitive' } },
        ];
    }
    const [total, data] = yield Promise.all([
        db_1.default.user.count({ where: whereConditions }),
        db_1.default.user.findMany({
            where: whereConditions,
            skip,
            take: limit,
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
                whatsappNumber: true,
                bloodGroup: true,
                skills: true,
                accommodationType: true,
                accommodationName: true,
                permanentAddress: true,
                isAffiliatedWithOther: true,
                otherOrgName: true,
                rudcMemberType: true,
                rudcStatus: true,
                rudcJoinedAt: true,
                interviewDate: true,
                interviewNotes: true,
                interviewEmailSentAt: true,
                supervisorId: true,
                supervisor: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
                rudcTeams: {
                    include: {
                        team: true,
                    },
                },
                _count: {
                    select: {
                        supervisedVolunteers: true,
                        iyanotPayments: true,
                    },
                },
            },
        }),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        data,
    };
});
// 3. Get RUDC Member Details by ID
const getRudcMemberById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const member = yield db_1.default.user.findUnique({
        where: { id },
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
            whatsappNumber: true,
            bloodGroup: true,
            skills: true,
            accommodationType: true,
            accommodationName: true,
            permanentAddress: true,
            isAffiliatedWithOther: true,
            otherOrgName: true,
            rudcTermsAccepted: true,
            isRudcMember: true,
            rudcMemberType: true,
            rudcStatus: true,
            rudcJoinedAt: true,
            interviewDate: true,
            interviewNotes: true,
            interviewEmailSentAt: true,
            supervisorId: true,
            supervisor: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    rudcMemberType: true,
                },
            },
            supervisedVolunteers: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    department: true,
                    rudcMemberType: true,
                    rudcStatus: true,
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
                include: {
                    collectedBy: {
                        select: { id: true, name: true, role: true },
                    },
                },
            },
            createdAt: true,
        },
    });
    if (!member || !member.isRudcMember) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'RUDC member not found!');
    }
    return member;
});
// 4. Update RUDC Member (Approve, Promote, Assign Supervisor, Notes)
const updateRudcMember = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.user.findUnique({
        where: { id },
    });
    if (!existing || !existing.isRudcMember) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'RUDC member not found!');
    }
    // Prevent self-supervision
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
            interviewNotes: payload.interviewNotes,
            interviewEmailSentAt: payload.interviewEmailSentAt
                ? new Date(payload.interviewEmailSentAt)
                : undefined,
        },
    });
    const { password: _ } = updated, cleanData = __rest(updated, ["password"]);
    return cleanData;
});
// 5. Send Interview Call Email (Single or Bulk)
const sendInterviewEmail = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, interviewDate, interviewTime, venueOrLink, instructions, subject } = payload;
    const users = yield db_1.default.user.findMany({
        where: {
            id: { in: userIds },
            isRudcMember: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rudcStatus: true,
        },
    });
    if (!users.length) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No matching RUDC applicants found for the provided IDs.');
    }
    const emailSubject = subject || 'Interview Invitation - Rajshahi University Dawah Community (RUDC)';
    const formattedDate = new Date(interviewDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const emailResults = [];
    for (const user of users) {
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #004F32;">
          <h1 style="color: #004F32; margin: 0; font-size: 24px;">Rajshahi University Dawah Community</h1>
          <p style="color: #C78700; margin: 4px 0 0 0; font-weight: bold; font-size: 13px;">MEMBERSHIP SELECTION COMMITTEE</p>
        </div>

        <p style="font-size: 16px;">Assalamu Alaikum wa Rahmatullahi wa Barakatuh, <strong>${user.name}</strong>,</p>

        <p style="font-size: 14px; line-height: 1.6;">
          Thank you for applying to join the <strong>Rajshahi University Dawah Community (RUDC)</strong> as a volunteer. 
          We are pleased to invite you for an in-person / online interview as part of our review process.
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #004F32; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>📅 Date:</strong> ${formattedDate}</p>
          ${interviewTime ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>⏰ Time:</strong> ${interviewTime}</p>` : ''}
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>📍 Venue / Meeting:</strong> ${venueOrLink}</p>
          ${instructions ? `<p style="margin: 0; font-size: 14px;"><strong>📝 Instructions:</strong> ${instructions}</p>` : ''}
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          Please be on time and come prepared. If you have any questions or scheduling conflicts, please contact us immediately.
        </p>

        <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
          <p style="margin: 0 0 4px 0;"><strong>Rajshahi University Dawah Community (RUDC)</strong></p>
          <p style="margin: 0;">RU Islamic Library, Shop No. 44, Stadium Market, Rajshahi University</p>
        </div>
      </div>
    `;
        const sent = yield (0, emailSender_1.default)({
            to: user.email,
            subject: emailSubject,
            html: htmlContent,
            text: `Assalamu Alaikum ${user.name},\nYou are invited for an interview with RUDC on ${formattedDate} at ${venueOrLink}.`,
        });
        emailResults.push({ id: user.id, email: user.email, sent });
    }
    // Update interview status in database for all selected users
    yield db_1.default.user.updateMany({
        where: {
            id: { in: userIds },
        },
        data: {
            rudcStatus: client_1.RudcApplicationStatus.INTERVIEW_CALLED,
            interviewDate: new Date(interviewDate),
            interviewNotes: instructions || null,
            interviewEmailSentAt: new Date(),
        },
    });
    return {
        totalSent: emailResults.filter((r) => r.sent).length,
        results: emailResults,
    };
});
// 6. Pre-existing RUDC Member Manual Entry from Dashboard
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
    if (existingUser) {
        userId = existingUser.id;
        yield db_1.default.user.update({
            where: { id: userId },
            data: {
                name: payload.name || existingUser.name,
                department: payload.department || existingUser.department,
                faculty: payload.faculty || existingUser.faculty,
                whatsappNumber: payload.whatsappNumber || existingUser.whatsappNumber,
                bloodGroup: payload.bloodGroup || existingUser.bloodGroup,
                skills: payload.skills || existingUser.skills,
                accommodationType: payload.accommodationType || existingUser.accommodationType,
                accommodationName: payload.accommodationName || existingUser.accommodationName,
                permanentAddress: payload.permanentAddress || existingUser.permanentAddress,
                isRudcMember: true,
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
                whatsappNumber: payload.whatsappNumber,
                bloodGroup: payload.bloodGroup,
                skills: payload.skills || [],
                accommodationType: payload.accommodationType,
                accommodationName: payload.accommodationName,
                permanentAddress: payload.permanentAddress,
                isRudcMember: true,
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
// 7. Team Management
const getAllRudcTeams = () => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.rudcTeam.findMany({
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatarUrl: true,
                            rudcMemberType: true,
                            rudcStatus: true,
                        },
                    },
                },
            },
            _count: {
                select: { members: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
});
const createRudcTeam = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.rudcTeam.findUnique({
        where: { name: payload.name },
    });
    if (existing) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A team with this name already exists!');
    }
    return db_1.default.rudcTeam.create({
        data: payload,
    });
});
const updateRudcTeam = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.rudcTeam.update({
        where: { id },
        data: payload,
    });
});
const deleteRudcTeam = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.rudcTeam.delete({
        where: { id },
    });
});
const assignTeamMembers = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId, userIds, role = 'MEMBER' } = payload;
    const team = yield db_1.default.rudcTeam.findUnique({
        where: { id: teamId },
    });
    if (!team) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Team not found!');
    }
    const operations = userIds.map((userId) => db_1.default.userRudcTeam.upsert({
        where: {
            userId_teamId: {
                userId,
                teamId,
            },
        },
        create: {
            userId,
            teamId,
            role,
        },
        update: {
            role,
        },
    }));
    return Promise.all(operations);
});
const removeTeamMember = (teamId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.userRudcTeam.deleteMany({
        where: {
            teamId,
            userId,
        },
    });
});
// 8. Monthly 50 TK Chada / Iyanot Tracking
const getRudcIyanotRecords = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const whereConditions = {};
    if (query.userId) {
        whereConditions.userId = Number(query.userId);
    }
    if (query.month) {
        whereConditions.month = Number(query.month);
    }
    if (query.year) {
        whereConditions.year = Number(query.year);
    }
    if (query.status) {
        whereConditions.status = query.status;
    }
    if (query.paymentMethod) {
        whereConditions.paymentMethod = query.paymentMethod;
    }
    if (query.collectedById) {
        whereConditions.collectedById = Number(query.collectedById);
    }
    if (query.searchTerm) {
        whereConditions.user = {
            OR: [
                { name: { contains: String(query.searchTerm), mode: 'insensitive' } },
                { phone: { contains: String(query.searchTerm), mode: 'insensitive' } },
                { studentOrVoterId: { contains: String(query.searchTerm), mode: 'insensitive' } },
            ],
        };
    }
    const [total, data] = yield Promise.all([
        db_1.default.rudcIyanot.count({ where: whereConditions }),
        db_1.default.rudcIyanot.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        studentOrVoterId: true,
                        department: true,
                        rudcMemberType: true,
                    },
                },
                collectedBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        }),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        data,
    };
});
const recordIyanotPayment = (payload, recorderUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield db_1.default.user.findUnique({
        where: { id: payload.userId },
    });
    if (!user || !user.isRudcMember) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'RUDC member not found!');
    }
    const receiptNo = `RUDC-IYT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const iyanot = yield db_1.default.rudcIyanot.upsert({
        where: {
            userId_month_year: {
                userId: payload.userId,
                month: payload.month,
                year: payload.year,
            },
        },
        create: {
            userId: payload.userId,
            month: payload.month,
            year: payload.year,
            amount: (_a = payload.amount) !== null && _a !== void 0 ? _a : 50.0,
            status: client_1.IyanotStatus.PAID,
            paymentMethod: payload.paymentMethod || client_1.IyanotPaymentMethod.ONLINE,
            collectedById: payload.collectedById || recorderUserId || null,
            transactionId: payload.transactionId || null,
            receiptNo,
            remarks: payload.remarks || null,
            paidAt: new Date(),
        },
        update: {
            amount: (_b = payload.amount) !== null && _b !== void 0 ? _b : 50.0,
            status: client_1.IyanotStatus.PAID,
            paymentMethod: payload.paymentMethod || client_1.IyanotPaymentMethod.ONLINE,
            collectedById: payload.collectedById || recorderUserId || null,
            transactionId: payload.transactionId || null,
            remarks: payload.remarks || null,
            paidAt: new Date(),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            collectedBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    return iyanot;
});
// 9. Member Self Profile & Stats
const getMyRudcProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const member = yield db_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            studentOrVoterId: true,
            department: true,
            faculty: true,
            whatsappNumber: true,
            bloodGroup: true,
            skills: true,
            accommodationType: true,
            accommodationName: true,
            permanentAddress: true,
            isRudcMember: true,
            rudcMemberType: true,
            rudcStatus: true,
            rudcJoinedAt: true,
            supervisor: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
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
    return member;
});
// 10. Public Landing Page Statistics
const getPublicRudcStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [volunteersCount, permanentMembersCount, teamsCount, iyanotTotal] = yield Promise.all([
        db_1.default.user.count({
            where: {
                isRudcMember: true,
                rudcMemberType: client_1.RudcMemberType.VOLUNTEER,
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
        db_1.default.rudcTeam.count(),
        db_1.default.rudcIyanot.count({
            where: { status: client_1.IyanotStatus.PAID },
        }),
    ]);
    return {
        volunteersCount,
        permanentMembersCount,
        totalMembers: volunteersCount + permanentMembersCount,
        teamsCount,
        iyanotTotal,
    };
});
exports.RudcService = {
    applyForRudc,
    getAllRudcMembers,
    getRudcMemberById,
    updateRudcMember,
    sendInterviewEmail,
    createPreExistedRudcMember,
    getAllRudcTeams,
    createRudcTeam,
    updateRudcTeam,
    deleteRudcTeam,
    assignTeamMembers,
    removeTeamMember,
    getRudcIyanotRecords,
    recordIyanotPayment,
    getMyRudcProfile,
    getPublicRudcStats,
};

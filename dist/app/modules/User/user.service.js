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
exports.UserService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const passwordHelpers_1 = require("../../utils/passwordHelpers");
const registerMember = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!payload.email || !payload.phone || !payload.studentOrVoterId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email, Phone, and Student/Voter ID are mandatory fields!');
    }
    const isExistingUser = yield db_1.default.user.findFirst({
        where: {
            OR: [
                { email: payload.email },
                { phone: payload.phone },
                { studentOrVoterId: payload.studentOrVoterId },
            ],
        },
    });
    if (isExistingUser) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email, phone, or Student/Voter ID already registered!');
    }
    const hashedPassword = yield (0, passwordHelpers_1.hashPassword)(payload.password, config_1.default.bcrypt_salt_rounds);
    const paymentMethod = payload.paymentMethod || client_1.PaymentMethod.CASH;
    let membershipStartedAt = payload.membershipStartedAt
        ? new Date(payload.membershipStartedAt)
        : null;
    let membershipExpiresAt = payload.membershipExpiresAt
        ? new Date(payload.membershipExpiresAt)
        : null;
    let isPaid = (_a = payload.isPaid) !== null && _a !== void 0 ? _a : false;
    let initialStatus = payload.status;
    if (!initialStatus) {
        if (membershipExpiresAt || payload.isPaid) {
            initialStatus = client_1.UserStatus.ACTIVE;
            isPaid = true;
            if (!membershipStartedAt) {
                membershipStartedAt = new Date();
            }
            if (!membershipExpiresAt) {
                const exp = new Date(membershipStartedAt.getTime());
                exp.setFullYear(exp.getFullYear() + 1);
                membershipExpiresAt = exp;
            }
        }
        else {
            initialStatus =
                paymentMethod === client_1.PaymentMethod.ONLINE
                    ? client_1.UserStatus.PENDING_PAYMENT
                    : client_1.UserStatus.PENDING_APPROVAL;
        }
    }
    // Auto-set INACTIVE if membership is already expired
    if (membershipExpiresAt &&
        new Date(membershipExpiresAt) < new Date() &&
        initialStatus !== client_1.UserStatus.BLOCKED) {
        initialStatus = client_1.UserStatus.INACTIVE;
        isPaid = false;
    }
    const newUser = yield db_1.default.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            password: hashedPassword,
            role: client_1.UserRole.MEMBER,
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
    const { password: _ } = newUser, userData = __rest(newUser, ["password"]);
    return userData;
});
const getAllUsersFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Automatically sync expired memberships to INACTIVE status (unless blocked)
    yield db_1.default.user.updateMany({
        where: {
            status: client_1.UserStatus.ACTIVE,
            membershipExpiresAt: {
                lt: new Date(),
            },
        },
        data: {
            status: client_1.UserStatus.INACTIVE,
            isPaid: false,
        },
    });
    const { org, isRudcMember } = query, remainingQuery = __rest(query, ["org", "isRudcMember"]);
    const userQuery = new queryBuilder_1.default(db_1.default.user, remainingQuery, {
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
        }
        else if (org === 'RUIL') {
            userQuery.where({ org: { in: ['RUIL', 'BOTH'] } });
        }
        else {
            userQuery.where({ org });
        }
    }
    if (isRudcMember !== undefined && isRudcMember !== 'ALL') {
        userQuery.where({ isRudcMember: isRudcMember === 'true' || isRudcMember === true });
    }
    const result = yield userQuery.execute();
    const sanitizedData = result.data.map((user) => {
        const { password } = user, rest = __rest(user, ["password"]);
        return rest;
    });
    return {
        meta: result.meta,
        data: sanitizedData,
    };
});
const getUserByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    // Auto-sync status to INACTIVE if expired
    if (user.status === client_1.UserStatus.ACTIVE &&
        user.membershipExpiresAt &&
        new Date(user.membershipExpiresAt) < new Date()) {
        const updatedUser = yield db_1.default.user.update({
            where: { id },
            data: {
                status: client_1.UserStatus.INACTIVE,
                isPaid: false,
            },
        });
        const { password: _ } = updatedUser, userData = __rest(updatedUser, ["password"]);
        return userData;
    }
    const { password } = user, userData = __rest(user, ["password"]);
    return userData;
});
const updateUserInDB = (id, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    // Shifters are strictly forbidden from modifying user roles (own, other members, or staff)
    if (authUser && authUser.role === client_1.UserRole.SHIFTER) {
        if (payload.role !== undefined && payload.role !== user.role) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Shifters are not permitted to change user roles of members, others, or their own!');
        }
    }
    // Check uniqueness if email, phone, or studentOrVoterId is modified
    if (payload.email && payload.email !== user.email) {
        const existing = yield db_1.default.user.findFirst({
            where: { email: payload.email, id: { not: id } },
        });
        if (existing) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email is already registered to another user!');
        }
    }
    if (payload.phone && payload.phone !== user.phone) {
        const existing = yield db_1.default.user.findFirst({
            where: { phone: payload.phone, id: { not: id } },
        });
        if (existing) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Phone number is already registered to another user!');
        }
    }
    if (payload.studentOrVoterId && payload.studentOrVoterId !== user.studentOrVoterId) {
        const existing = yield db_1.default.user.findFirst({
            where: { studentOrVoterId: payload.studentOrVoterId, id: { not: id } },
        });
        if (existing) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Student or Voter ID is already registered to another user!');
        }
    }
    const updateData = Object.assign({}, payload);
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
    const effectiveExpiry = updateData.membershipExpiresAt !== undefined
        ? updateData.membershipExpiresAt
        : user.membershipExpiresAt;
    const isExpired = effectiveExpiry && new Date(effectiveExpiry) < new Date();
    // Status handling:
    // 1. If explicitly set to BLOCKED, keep BLOCKED
    // 2. If user is currently BLOCKED and no status change provided, stay BLOCKED
    // 3. When membership is expired, status automatically becomes INACTIVE
    // 4. When membership is active/renewed, status automatically becomes ACTIVE & isPaid = true
    if (payload.status === client_1.UserStatus.BLOCKED) {
        updateData.status = client_1.UserStatus.BLOCKED;
    }
    else if (user.status === client_1.UserStatus.BLOCKED && payload.status === undefined) {
        updateData.status = client_1.UserStatus.BLOCKED;
    }
    else if (isExpired) {
        updateData.status = client_1.UserStatus.INACTIVE;
        updateData.isPaid = false;
    }
    else if (payload.status === client_1.UserStatus.ACTIVE ||
        (user.status === client_1.UserStatus.INACTIVE && !isExpired && effectiveExpiry)) {
        updateData.status = client_1.UserStatus.ACTIVE;
        updateData.isPaid = true;
        if (!user.membershipStartedAt && !updateData.membershipStartedAt) {
            const startDate = new Date();
            const expireDate = new Date(startDate.getTime());
            expireDate.setFullYear(expireDate.getFullYear() + 1);
            updateData.membershipStartedAt = startDate;
            updateData.membershipExpiresAt = expireDate;
        }
    }
    const updatedUser = yield db_1.default.user.update({
        where: { id },
        data: updateData,
    });
    // If user role was changed or demoted to MEMBER, deactivate their active duty schedules
    if (updateData.role === client_1.UserRole.MEMBER) {
        yield db_1.default.shifterSchedule.updateMany({
            where: { shifterId: id },
            data: { isActive: false },
        });
    }
    const { password } = updatedUser, userData = __rest(updatedUser, ["password"]);
    return userData;
});
const approveCashPaymentInDB = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
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
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedUser = yield tx.user.update({
            where: { id: userId },
            data: {
                status: client_1.UserStatus.ACTIVE,
                isPaid: true,
                paymentMethod: client_1.PaymentMethod.CASH,
                membershipStartedAt: user.membershipStartedAt || now,
                membershipExpiresAt: expireDate,
            },
        });
        const paymentRecord = yield tx.payment.create({
            data: {
                transactionId,
                userId,
                amount: membershipAmount,
                paymentMethod: client_1.PaymentMethod.CASH,
                status: client_1.PaymentStatus.COMPLETED,
                paidAt: now,
            },
        });
        const { password: _ } = updatedUser, userData = __rest(updatedUser, ["password"]);
        return { user: userData, payment: paymentRecord };
    }));
    return result;
});
const updateMyProfileInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const safeData = {};
    if (payload.name !== undefined)
        safeData.name = payload.name;
    if (payload.avatarUrl !== undefined)
        safeData.avatarUrl = payload.avatarUrl;
    if (payload.department !== undefined)
        safeData.department = payload.department;
    if (payload.session !== undefined)
        safeData.session = payload.session;
    if (payload.institution !== undefined)
        safeData.institution = payload.institution;
    if (payload.phone !== undefined)
        safeData.phone = payload.phone;
    if (payload.faculty !== undefined)
        safeData.faculty = payload.faculty;
    if (payload.whatsappNumber !== undefined)
        safeData.whatsappNumber = payload.whatsappNumber;
    if (payload.bloodGroup !== undefined)
        safeData.bloodGroup = payload.bloodGroup;
    if (payload.skills !== undefined)
        safeData.skills = payload.skills;
    if (payload.accommodationType !== undefined)
        safeData.accommodationType = payload.accommodationType;
    if (payload.accommodationName !== undefined)
        safeData.accommodationName = payload.accommodationName;
    if (payload.permanentAddress !== undefined)
        safeData.permanentAddress = payload.permanentAddress;
    // A member can also update their Registered Email and Student / National Voter ID
    if (payload.email !== undefined && payload.email.trim() && payload.email.trim() !== user.email) {
        const emailExists = yield db_1.default.user.findFirst({
            where: { email: payload.email.trim(), id: { not: userId } },
        });
        if (emailExists) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This email address is already in use by another member!');
        }
        safeData.email = payload.email.trim();
    }
    if (payload.studentOrVoterId !== undefined &&
        payload.studentOrVoterId.trim() &&
        payload.studentOrVoterId.trim() !== user.studentOrVoterId) {
        const idExists = yield db_1.default.user.findFirst({
            where: { studentOrVoterId: payload.studentOrVoterId.trim(), id: { not: userId } },
        });
        if (idExists) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This Student or Voter ID is already registered to another member!');
        }
        safeData.studentOrVoterId = payload.studentOrVoterId.trim();
    }
    const updatedUser = yield db_1.default.user.update({
        where: { id: userId },
        data: safeData,
    });
    const { password: _ } = updatedUser, userData = __rest(updatedUser, ["password"]);
    return userData;
});
const renewMembershipInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
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
    }
    else if (amount) {
        monthsToAdd = Math.max(3, Math.round((amount / 100) * 3));
    }
    else {
        monthsToAdd = 6;
        amount = 200;
    }
    expireDate.setMonth(expireDate.getMonth() + monthsToAdd);
    const paymentMethod = payload.paymentMethod || client_1.PaymentMethod.CASH;
    const transactionId = `MEM-RENEW-${user.id}-${Date.now()}`;
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedUser = yield tx.user.update({
            where: { id: userId },
            data: {
                status: client_1.UserStatus.ACTIVE,
                isPaid: true,
                paymentMethod,
                membershipStartedAt: user.membershipStartedAt || now,
                membershipExpiresAt: expireDate,
            },
        });
        const paymentRecord = yield tx.payment.create({
            data: {
                transactionId,
                userId,
                amount,
                paymentMethod,
                status: client_1.PaymentStatus.COMPLETED,
                paidAt: now,
            },
        });
        const { password: _ } = updatedUser, userData = __rest(updatedUser, ["password"]);
        return { user: userData, payment: paymentRecord };
    }));
    return result;
});
const notificationSender_1 = require("../../utils/notificationSender");
const sendNoticeToUserInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User account not found!');
    }
    if (!payload.message || !payload.message.trim()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Notice message cannot be empty!');
    }
    yield (0, notificationSender_1.sendMembershipNoticeAlert)({
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
});
const deleteUserFromDB = (userId, requestingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (userId === requestingUserId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You cannot delete your own Super Admin account!');
    }
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User account not found!');
    }
    // Check if member has active borrows before deletion
    const activeBorrows = yield db_1.default.borrow.count({
        where: {
            userId,
            status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] },
        },
    });
    if (activeBorrows > 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot delete user! Member currently has ${activeBorrows} active/overdue book loan(s) that must be returned first.`);
    }
    // Delete user record from DB
    return yield db_1.default.user.delete({
        where: { id: userId },
    });
});
const getUserOptionsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield db_1.default.user.findMany({
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
    const departmentsSet = new Set();
    const sessionsSet = new Set();
    const institutionsSet = new Set();
    const facultiesSet = new Set();
    const accommodationNamesSet = new Set();
    const skillsSet = new Set();
    const villagesSet = new Set();
    users.forEach((u) => {
        var _a, _b, _c, _d, _e, _f, _g;
        if ((_a = u.department) === null || _a === void 0 ? void 0 : _a.trim())
            departmentsSet.add(u.department.trim());
        if ((_b = u.session) === null || _b === void 0 ? void 0 : _b.trim())
            sessionsSet.add(u.session.trim());
        if ((_c = u.institution) === null || _c === void 0 ? void 0 : _c.trim())
            institutionsSet.add(u.institution.trim());
        if ((_d = u.faculty) === null || _d === void 0 ? void 0 : _d.trim())
            facultiesSet.add(u.faculty.trim());
        if ((_e = u.accommodationName) === null || _e === void 0 ? void 0 : _e.trim())
            accommodationNamesSet.add(u.accommodationName.trim());
        if (Array.isArray(u.skills)) {
            u.skills.forEach((s) => {
                if (s === null || s === void 0 ? void 0 : s.trim())
                    skillsSet.add(s.trim());
            });
        }
        if ((_f = u.permanentAddress) === null || _f === void 0 ? void 0 : _f.trim()) {
            try {
                const parsed = JSON.parse(u.permanentAddress);
                if ((_g = parsed === null || parsed === void 0 ? void 0 : parsed.village) === null || _g === void 0 ? void 0 : _g.trim())
                    villagesSet.add(parsed.village.trim());
            }
            catch (_h) {
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
});
const convertMembershipInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, targetRoleOrOrg, confirmPayment = false, paymentMethod = client_1.PaymentMethod.CASH, months = 12, } = payload;
    const users = yield db_1.default.user.findMany({
        where: { id: { in: userIds } },
    });
    if (users.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No users found for the provided IDs!');
    }
    const results = [];
    for (const user of users) {
        const updateData = {};
        let paymentRecord = null;
        if (targetRoleOrOrg === 'MAKE_RUDC_MEMBER') {
            updateData.isRudcMember = true;
            updateData.rudcMemberType = client_1.RudcMemberType.MEMBER;
            updateData.rudcStatus = client_1.RudcApplicationStatus.APPROVED;
            if (!user.rudcJoinedAt)
                updateData.rudcJoinedAt = new Date();
            if (user.org === client_1.Organization.RUIL) {
                updateData.org = client_1.Organization.BOTH;
            }
        }
        else if (targetRoleOrOrg === 'MAKE_RUDC_VOLUNTEER') {
            updateData.isRudcMember = true;
            updateData.rudcMemberType = client_1.RudcMemberType.VOLUNTEER;
            updateData.rudcStatus = client_1.RudcApplicationStatus.APPROVED;
            if (!user.rudcJoinedAt)
                updateData.rudcJoinedAt = new Date();
            if (user.org === client_1.Organization.RUIL) {
                updateData.org = client_1.Organization.BOTH;
            }
        }
        else if (targetRoleOrOrg === 'MAKE_RUIL_MEMBER') {
            const now = new Date();
            const hasActivePaidMembership = user.isPaid &&
                user.membershipExpiresAt &&
                new Date(user.membershipExpiresAt) > now;
            if (!hasActivePaidMembership && !confirmPayment) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `User "${user.name}" (#${user.id}) does not have an active RUIL paid membership! Please confirm payment to grant RUIL membership.`);
            }
            if (!hasActivePaidMembership && confirmPayment) {
                let baseDate = now;
                if (user.membershipExpiresAt && new Date(user.membershipExpiresAt) > now) {
                    baseDate = new Date(user.membershipExpiresAt);
                }
                const expireDate = new Date(baseDate.getTime());
                expireDate.setMonth(expireDate.getMonth() + (months || 12));
                updateData.isPaid = true;
                updateData.status = client_1.UserStatus.ACTIVE;
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
                    status: client_1.PaymentStatus.COMPLETED,
                    paidAt: now,
                };
            }
            if (user.org === client_1.Organization.RUDC) {
                updateData.org = client_1.Organization.BOTH;
            }
        }
        const updatedUser = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const u = yield tx.user.update({
                where: { id: user.id },
                data: updateData,
            });
            if (paymentRecord) {
                yield tx.payment.create({
                    data: paymentRecord,
                });
            }
            return u;
        }));
        const { password: _ } = updatedUser, userData = __rest(updatedUser, ["password"]);
        results.push(userData);
    }
    return results;
});
exports.UserService = {
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

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
        },
    });
    const { password: _ } = newUser, userData = __rest(newUser, ["password"]);
    return userData;
});
const getAllUsersFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const userQuery = new queryBuilder_1.default(db_1.default.user, query, {
        searchableFields: ['name', 'email', 'phone', 'studentOrVoterId', 'department', 'institution'],
        filterableFields: ['role', 'status', 'department', 'session', 'paymentMethod', 'isPaid'],
    })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();
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
    // When status is set to ACTIVE, automatically update isPaid to true & set membership dates if missing
    if (payload.status === client_1.UserStatus.ACTIVE) {
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
    const expireDate = new Date(now.getTime());
    expireDate.setFullYear(expireDate.getFullYear() + 1);
    const membershipAmount = amount || 500;
    const transactionId = `CASH-MEM-${user.id}-${Date.now()}`;
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedUser = yield tx.user.update({
            where: { id: userId },
            data: {
                status: client_1.UserStatus.ACTIVE,
                isPaid: true,
                paymentMethod: client_1.PaymentMethod.CASH,
                membershipStartedAt: now,
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
    // Strictly only allow safe profile fields to be updated
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
    expireDate.setMonth(expireDate.getMonth() + 6); // 6 months extension (100 Taka)
    const amount = payload.amount || 100;
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
exports.UserService = {
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

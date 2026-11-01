"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const rudcMember_service_1 = require("../RudcMember/rudcMember.service");
const registerMember = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!payload.name) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Name is a mandatory field!');
    }
    // Check unique constraints for email and phone if provided
    if (payload.email) {
        const existingEmail = yield db_1.default.user.findUnique({
            where: { email: payload.email },
        });
        if (existingEmail) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email is already registered!');
        }
    }
    if (payload.phone) {
        const existingPhone = yield db_1.default.user.findUnique({
            where: { phone: payload.phone },
        });
        if (existingPhone) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Phone number is already registered!');
        }
    }
    if (payload.studentOrVoterId) {
        const existingAcademic = yield db_1.default.academicProfile.findUnique({
            where: { studentOrVoterId: payload.studentOrVoterId },
        });
        if (existingAcademic) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Student / Voter ID is already registered!');
        }
    }
    const hashedPassword = payload.password
        ? yield (0, passwordHelpers_1.hashPassword)(payload.password, config_1.default.bcrypt_salt_rounds)
        : null;
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
    const targetRole = payload.role || client_1.UserRole.MEMBER;
    const targetOrg = payload.org || client_1.Organization.RUIL;
    const newUser = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const createdUser = yield tx.user.create({
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
            yield tx.academicProfile.create({
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
        if (targetOrg === client_1.Organization.RUIL || targetOrg === client_1.Organization.BOTH) {
            yield tx.ruilMemberProfile.create({
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
        if (targetOrg === client_1.Organization.RUDC || targetOrg === client_1.Organization.BOTH) {
            yield tx.rudcMemberProfile.create({
                data: {
                    userId: createdUser.id,
                    whatsappNumber: payload.whatsappNumber || payload.phone || null,
                    skills: payload.skills || [],
                    permanentAddress: payload.permanentAddress || null,
                    rudcMemberType: payload.rudcMemberType || client_1.RudcMemberType.VOLUNTEER,
                    rudcStatus: payload.rudcStatus || client_1.RudcApplicationStatus.PENDING_REVIEW,
                    rudcJoinedAt: isPaid ? new Date() : null,
                },
            });
        }
        return yield tx.user.findUnique({
            where: { id: createdUser.id },
            include: {
                academicProfile: true,
                ruilProfile: true,
                rudcProfile: true,
            },
        });
    }));
    const _b = newUser, { password: _ } = _b, userData = __rest(_b, ["password"]);
    return (0, rudcMember_service_1.formatUserWithRudcProfile)(userData);
});
// Bulk Member Registration by Admin/Shifter
const registerBulkMembersInDB = (members, targetOrg) => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    for (const member of members) {
        try {
            const created = yield registerMember(Object.assign(Object.assign({}, member), { org: targetOrg || member.org || client_1.Organization.RUIL }));
            results.push({ success: true, email: member.email, data: created });
        }
        catch (err) {
            results.push({ success: false, email: member.email, error: err.message });
        }
    }
    return results;
});
const getAllUsersFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { org, isRudcMember } = query, remainingQuery = __rest(query, ["org", "isRudcMember"]);
    const userQuery = new queryBuilder_1.default(db_1.default.user, remainingQuery, {
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
        }
        else if (org === 'RUIL') {
            userQuery.where({ org: { in: ['RUIL', 'BOTH'] } });
        }
        else {
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
    const result = yield userQuery.execute();
    const sanitizedData = result.data.map((user) => {
        const { password } = user, rest = __rest(user, ["password"]);
        return (0, rudcMember_service_1.formatUserWithRudcProfile)(rest);
    });
    return {
        meta: result.meta,
        data: sanitizedData,
    };
});
const getUserByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const { password } = user, userData = __rest(user, ["password"]);
    return (0, rudcMember_service_1.formatUserWithRudcProfile)(userData);
});
const updateUserInDB = (id, payload, authUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id },
        include: { academicProfile: true, ruilProfile: true, rudcProfile: true },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    if (authUser && authUser.role === client_1.UserRole.SHIFTER) {
        if (payload.role !== undefined && payload.role !== user.role) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Shifters are not permitted to change user roles!');
        }
    }
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
    const userUpdateData = {};
    if (payload.name)
        userUpdateData.name = payload.name;
    if (payload.email)
        userUpdateData.email = payload.email;
    if (payload.phone)
        userUpdateData.phone = payload.phone;
    if (payload.avatarUrl)
        userUpdateData.avatarUrl = payload.avatarUrl;
    if (payload.gender !== undefined)
        userUpdateData.gender = payload.gender;
    if (payload.dateOfBirth !== undefined)
        userUpdateData.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
    if (payload.role)
        userUpdateData.role = payload.role;
    if (payload.status)
        userUpdateData.status = payload.status;
    if (payload.org)
        userUpdateData.org = payload.org;
    yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        // 1. Update root User
        if (Object.keys(userUpdateData).length > 0) {
            yield tx.user.update({ where: { id }, data: userUpdateData });
        }
        // 2. Update/Upsert AcademicProfile
        const hasAcademicUpdates = payload.institution ||
            payload.faculty ||
            payload.department ||
            payload.session ||
            payload.studentOrVoterId ||
            payload.bloodGroup !== undefined ||
            payload.accommodationType !== undefined ||
            payload.accommodationName !== undefined;
        if (hasAcademicUpdates) {
            const academicData = {};
            if (payload.institution)
                academicData.institution = payload.institution;
            if (payload.faculty)
                academicData.faculty = payload.faculty;
            if (payload.department)
                academicData.department = payload.department;
            if (payload.session)
                academicData.session = payload.session;
            if (payload.studentOrVoterId)
                academicData.studentOrVoterId = payload.studentOrVoterId;
            if (payload.bloodGroup !== undefined)
                academicData.bloodGroup = payload.bloodGroup;
            if (payload.accommodationType !== undefined)
                academicData.accommodationType = payload.accommodationType;
            if (payload.accommodationName !== undefined)
                academicData.accommodationName = payload.accommodationName;
            yield tx.academicProfile.upsert({
                where: { userId: id },
                create: Object.assign({ userId: id, faculty: payload.faculty || 'General', department: payload.department || 'General', session: payload.session || '2025-2026', studentOrVoterId: payload.studentOrVoterId || `ID-${id}` }, academicData),
                update: academicData,
            });
        }
        // 3. Update/Upsert RuilProfile
        const hasRuilUpdates = payload.isPaid !== undefined ||
            payload.paymentMethod !== undefined ||
            payload.membershipStartedAt !== undefined ||
            payload.membershipExpiresAt !== undefined ||
            payload.status !== undefined;
        if (hasRuilUpdates) {
            const ruilData = {};
            if (payload.isPaid !== undefined)
                ruilData.isPaid = payload.isPaid;
            if (payload.paymentMethod !== undefined)
                ruilData.paymentMethod = payload.paymentMethod;
            if (payload.status)
                ruilData.membershipStatus = payload.status;
            if (payload.membershipStartedAt)
                ruilData.membershipStartedAt = new Date(payload.membershipStartedAt);
            if (payload.membershipExpiresAt)
                ruilData.membershipExpiresAt = new Date(payload.membershipExpiresAt);
            yield tx.ruilMemberProfile.upsert({
                where: { userId: id },
                create: Object.assign({ userId: id, membershipStatus: payload.status || client_1.UserStatus.ACTIVE, isPaid: (_a = payload.isPaid) !== null && _a !== void 0 ? _a : true }, ruilData),
                update: ruilData,
            });
        }
        // 4. Update/Upsert RudcProfile
        const hasRudcUpdates = payload.whatsappNumber !== undefined ||
            payload.skills !== undefined ||
            payload.permanentAddress !== undefined ||
            payload.isRudcMember !== undefined ||
            payload.rudcMemberType !== undefined ||
            payload.rudcStatus !== undefined ||
            payload.supervisorId !== undefined;
        if (hasRudcUpdates) {
            const rudcData = {};
            if (payload.whatsappNumber !== undefined)
                rudcData.whatsappNumber = payload.whatsappNumber;
            if (payload.skills !== undefined)
                rudcData.skills = payload.skills;
            if (payload.permanentAddress !== undefined)
                rudcData.permanentAddress = payload.permanentAddress;
            if (payload.isRudcMember !== undefined)
                rudcData.isRudcMember = payload.isRudcMember;
            if (payload.rudcMemberType !== undefined)
                rudcData.rudcMemberType = payload.rudcMemberType;
            if (payload.rudcStatus !== undefined)
                rudcData.rudcStatus = payload.rudcStatus;
            if (payload.supervisorId !== undefined)
                rudcData.supervisorId = payload.supervisorId;
            yield tx.rudcMemberProfile.upsert({
                where: { userId: id },
                create: Object.assign({ userId: id, isRudcMember: (_b = payload.isRudcMember) !== null && _b !== void 0 ? _b : false }, rudcData),
                update: rudcData,
            });
        }
    }));
    return yield getUserByIdFromDB(id);
});
// Bulk Update Users
const bulkUpdateUsersInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, status, role, org } = payload;
    const updateData = {};
    if (status)
        updateData.status = status;
    if (role)
        updateData.role = role;
    if (org)
        updateData.org = org;
    const result = yield db_1.default.user.updateMany({
        where: { id: { in: userIds } },
        data: updateData,
    });
    return {
        updatedCount: result.count,
        message: `${result.count} users updated successfully!`,
    };
});
// Bulk Delete Users
const bulkDeleteUsersInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds } = payload;
    const result = yield db_1.default.user.deleteMany({
        where: { id: { in: userIds } },
    });
    return {
        deletedCount: result.count,
        message: `${result.count} users deleted successfully!`,
    };
});
const updateMyProfileInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield updateUserInDB(userId, payload);
});
const approveCashPaymentInDB = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
        include: { ruilProfile: true },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const now = new Date();
    const expireDate = new Date(now.getTime());
    expireDate.setFullYear(expireDate.getFullYear() + 1);
    yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        yield tx.user.update({
            where: { id: userId },
            data: { status: client_1.UserStatus.ACTIVE },
        });
        yield tx.ruilMemberProfile.upsert({
            where: { userId },
            create: {
                userId,
                membershipStatus: client_1.UserStatus.ACTIVE,
                isPaid: true,
                paymentMethod: client_1.PaymentMethod.CASH,
                membershipStartedAt: now,
                membershipExpiresAt: expireDate,
            },
            update: {
                membershipStatus: client_1.UserStatus.ACTIVE,
                isPaid: true,
                paymentMethod: client_1.PaymentMethod.CASH,
                membershipStartedAt: ((_a = user.ruilProfile) === null || _a === void 0 ? void 0 : _a.membershipStartedAt) || now,
                membershipExpiresAt: expireDate,
            },
        });
        yield tx.payment.create({
            data: {
                transactionId: `CASH-${userId}-${Date.now()}`,
                userId,
                amount: amount || 200,
                paymentMethod: client_1.PaymentMethod.CASH,
                status: client_1.PaymentStatus.PAID,
                paidAt: now,
            },
        });
    }));
    return yield getUserByIdFromDB(userId);
});
const renewMembershipInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
        include: { ruilProfile: true },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User account not found!');
    }
    const months = payload.months || 6;
    const now = new Date();
    let baseDate = now;
    if (((_a = user.ruilProfile) === null || _a === void 0 ? void 0 : _a.membershipExpiresAt) && new Date(user.ruilProfile.membershipExpiresAt) > now) {
        baseDate = new Date(user.ruilProfile.membershipExpiresAt);
    }
    const expireDate = new Date(baseDate.getTime());
    expireDate.setMonth(expireDate.getMonth() + months);
    yield db_1.default.ruilMemberProfile.upsert({
        where: { userId },
        create: {
            userId,
            membershipStatus: client_1.UserStatus.ACTIVE,
            isPaid: true,
            membershipStartedAt: now,
            membershipExpiresAt: expireDate,
        },
        update: {
            membershipStatus: client_1.UserStatus.ACTIVE,
            isPaid: true,
            membershipExpiresAt: expireDate,
        },
    });
    return yield getUserByIdFromDB(userId);
});
// Enhanced Bulk Conversion Engine
const convertMembershipInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, targetRoleOrOrg, confirmPayment = false, paymentMethod = client_1.PaymentMethod.CASH, months = 12, } = payload;
    const users = yield db_1.default.user.findMany({
        where: { id: { in: userIds } },
        include: { rudcProfile: true, ruilProfile: true, academicProfile: true },
    });
    if (users.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No users found for the provided IDs!');
    }
    const results = [];
    for (const user of users) {
        const now = new Date();
        if (targetRoleOrOrg === 'MAKE_RUDC_MEMBER' || targetRoleOrOrg === 'MAKE_RUDC_VOLUNTEER') {
            const memberType = targetRoleOrOrg === 'MAKE_RUDC_MEMBER' ? client_1.RudcMemberType.MEMBER : client_1.RudcMemberType.VOLUNTEER;
            yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                yield tx.user.update({
                    where: { id: user.id },
                    data: {
                        role: client_1.UserRole.MEMBER,
                        org: user.org === client_1.Organization.RUIL ? client_1.Organization.BOTH : client_1.Organization.RUDC,
                    },
                });
                if (payload.department || payload.session || payload.faculty || payload.studentOrVoterId || !user.academicProfile) {
                    yield tx.academicProfile.upsert({
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
                yield tx.rudcMemberProfile.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        isRudcMember: true,
                        rudcMemberType: memberType,
                        rudcStatus: client_1.RudcApplicationStatus.APPROVED,
                        rudcJoinedAt: now,
                    },
                    update: {
                        isRudcMember: true,
                        rudcMemberType: memberType,
                        rudcStatus: client_1.RudcApplicationStatus.APPROVED,
                        rudcJoinedAt: ((_a = user.rudcProfile) === null || _a === void 0 ? void 0 : _a.rudcJoinedAt) || now,
                    },
                });
            }));
            results.push({ userId: user.id, status: 'CONVERTED_TO_RUDC' });
        }
        else if (targetRoleOrOrg === 'MAKE_RUIL_MEMBER') {
            const expireDate = new Date(now.getTime());
            expireDate.setMonth(expireDate.getMonth() + months);
            yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                yield tx.user.update({
                    where: { id: user.id },
                    data: {
                        role: client_1.UserRole.MEMBER,
                        org: user.org === client_1.Organization.RUDC ? client_1.Organization.BOTH : client_1.Organization.RUIL,
                    },
                });
                if (payload.department || payload.session || payload.faculty || payload.studentOrVoterId || !user.academicProfile) {
                    yield tx.academicProfile.upsert({
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
                yield tx.ruilMemberProfile.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        membershipStatus: client_1.UserStatus.ACTIVE,
                        isPaid: confirmPayment,
                        paymentMethod,
                        membershipStartedAt: now,
                        membershipExpiresAt: expireDate,
                    },
                    update: {
                        membershipStatus: client_1.UserStatus.ACTIVE,
                        isPaid: confirmPayment || ((_a = user.ruilProfile) === null || _a === void 0 ? void 0 : _a.isPaid) || false,
                        membershipExpiresAt: expireDate,
                    },
                });
            }));
            results.push({ userId: user.id, status: 'CONVERTED_TO_RUIL' });
        }
        else if (targetRoleOrOrg === 'MAKE_GENERAL_USER') {
            yield db_1.default.user.update({
                where: { id: user.id },
                data: { role: client_1.UserRole.GENERAL_USER },
            });
            results.push({ userId: user.id, status: 'CONVERTED_TO_GENERAL_USER' });
        }
    }
    return results;
});
// CMS-Style Customizable Email Notice Dispatcher
const sendCustomNoticeInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, recipients, subject, htmlContent } = payload;
    const { sendEmail, compileEmailTemplate } = yield Promise.resolve().then(() => __importStar(require('../../utils/emailSender')));
    const recipientsList = [];
    if (userIds && userIds.length > 0) {
        const users = yield db_1.default.user.findMany({
            where: { id: { in: userIds } },
            select: { email: true, name: true },
        });
        users.forEach((u) => {
            if (u.email)
                recipientsList.push({ email: u.email, name: u.name });
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
        const success = yield sendEmail({
            to: item.email,
            subject: personalizedSubject,
            html: personalizedHtml,
        });
        if (success)
            successCount++;
    }
    return {
        totalRecipients: recipientsList.length,
        sentSuccessfully: successCount,
    };
});
const getEmailNoticeTemplatesInDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const { DefaultEmailTemplates } = yield Promise.resolve().then(() => __importStar(require('../../utils/emailSender')));
    return DefaultEmailTemplates;
});
const sendNoticeToUserInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user || !user.email) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User email not found!');
    }
    return yield sendCustomNoticeInDB({
        recipients: [user.email],
        subject: payload.subject || '[Notice from RU Islamic Library]',
        htmlContent: `<p>${payload.message || 'Important update regarding your account.'}</p>`,
    });
});
const deleteUserFromDB = (userId, requestingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (userId === requestingUserId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You cannot delete your own account!');
    }
    return yield db_1.default.user.delete({
        where: { id: userId },
    });
});
const getUserOptionsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const [departments, sessions, faculties] = yield Promise.all([
        db_1.default.academicProfile.findMany({ distinct: ['department'], select: { department: true } }),
        db_1.default.academicProfile.findMany({ distinct: ['session'], select: { session: true } }),
        db_1.default.academicProfile.findMany({ distinct: ['faculty'], select: { faculty: true } }),
    ]);
    return {
        departments: departments.map((d) => d.department).filter(Boolean),
        sessions: sessions.map((s) => s.session).filter(Boolean),
        faculties: faculties.map((f) => f.faculty).filter(Boolean),
    };
});
// Public Member Counts for Landing Page (Unauthenticated)
const getPublicStatsInDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const [activeRuilMembers, approvedRudcMembers, totalBooks, totalArticles, totalDonations] = yield Promise.all([
        db_1.default.ruilMemberProfile.count({
            where: { membershipStatus: client_1.UserStatus.ACTIVE },
        }),
        db_1.default.rudcMemberProfile.count({
            where: { rudcStatus: client_1.RudcApplicationStatus.APPROVED },
        }),
        db_1.default.book.count({
            where: { isArchived: false },
        }),
        db_1.default.article.count({
            where: { isPublished: true },
        }),
        db_1.default.donation.count(),
    ]);
    return {
        ruilMembersCount: activeRuilMembers,
        rudcMembersCount: approvedRudcMembers,
        totalBooksCount: totalBooks,
        totalArticlesCount: totalArticles,
        totalDonationsCount: totalDonations,
    };
});
exports.UserService = {
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

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcIyanotService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const getRudcIyanotRecords = (query, user) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year, status, userId, page = 1, limit = 20 } = query;
    const take = Number(limit) || 20;
    const skip = (Number(page) - 1) * take;
    const whereConditions = {};
    // If member/volunteer, they can only see their own records
    if (user.role === client_1.UserRole.MEMBER) {
        whereConditions.userId = user.id;
    }
    else if (userId) {
        whereConditions.userId = Number(userId);
    }
    if (month && month !== 'ALL') {
        whereConditions.month = Number(month);
    }
    if (year && year !== 'ALL') {
        whereConditions.year = Number(year);
    }
    if (status && status !== 'ALL') {
        whereConditions.status = status;
    }
    const [total, records] = yield Promise.all([
        db_1.default.rudcIyanot.count({ where: whereConditions }),
        db_1.default.rudcIyanot.findMany({
            where: whereConditions,
            skip,
            take,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        rudcMemberType: true,
                        department: true,
                    },
                },
                collectedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
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
        data: records,
    };
});
const recordIyanotPayment = (payload, actingUser) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, month, year, amount = 50, paymentMethod, transactionId, remarks } = payload;
    const targetUser = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!targetUser) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Target member not found!');
    }
    // If regular member is recording, verify ownership or permissions
    if (actingUser.role === client_1.UserRole.MEMBER && actingUser.id !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You can only submit iyanot payment for yourself!');
    }
    let collectedById = null;
    if (paymentMethod === client_1.IyanotPaymentMethod.CASH_OFFLINE &&
        ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(actingUser.role)) {
        collectedById = actingUser.id;
    }
    const receiptNo = `RUDC-IYN-${year}${String(month).padStart(2, '0')}-${userId}-${Date.now().toString(36).toUpperCase()}`;
    const record = yield db_1.default.rudcIyanot.upsert({
        where: {
            userId_month_year: {
                userId,
                month,
                year,
            },
        },
        create: {
            userId,
            month,
            year,
            amount,
            paymentMethod,
            status: client_1.IyanotStatus.PAID,
            collectedById,
            transactionId,
            receiptNo,
            remarks,
            paidAt: new Date(),
        },
        update: {
            amount,
            paymentMethod,
            status: client_1.IyanotStatus.PAID,
            collectedById: collectedById || undefined,
            transactionId: transactionId || undefined,
            remarks: remarks || undefined,
            paidAt: new Date(),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    rudcMemberType: true,
                },
            },
            collectedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    return record;
});
exports.RudcIyanotService = {
    getRudcIyanotRecords,
    recordIyanotPayment,
};

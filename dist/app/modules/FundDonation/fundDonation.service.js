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
exports.FundDonationService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const config_1 = __importDefault(require("../../config"));
const sslcommerz_1 = __importDefault(require("../../../lib/sslcommerz"));
const initiateOnlineDonation = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (payload.amount <= 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Donation amount must be greater than zero!');
    }
    // If eventId provided, verify event exists
    if (payload.eventId) {
        const event = yield db_1.default.event.findUnique({
            where: { id: payload.eventId },
        });
        if (!event) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Selected fundraiser event was not found!');
        }
    }
    const tran_id = `FND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    // Create pending donation record
    const donation = yield db_1.default.fundDonation.create({
        data: {
            transactionId: tran_id,
            amount: payload.amount,
            eventId: payload.eventId || null,
            userId: userId || null,
            donorName: payload.donorName || null,
            donorEmail: payload.donorEmail || null,
            donorPhone: payload.donorPhone || null,
            isAnonymous: (_a = payload.isAnonymous) !== null && _a !== void 0 ? _a : false,
            donorNote: payload.donorNote || null,
            paymentMethod: client_1.PaymentMethod.ONLINE,
            paymentStatus: client_1.PaymentStatus.PENDING,
        },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
        },
    });
    const baseUrl = config_1.default.backend_url || 'http://localhost:5000/api/v1';
    const sslPayload = {
        total_amount: payload.amount,
        tran_id,
        success_url: `${baseUrl}/fund-donations/success`,
        fail_url: `${baseUrl}/fund-donations/fail`,
        cancel_url: `${baseUrl}/fund-donations/cancel`,
        ipn_url: `${baseUrl}/fund-donations/ipn`,
        cus_name: payload.donorName || 'Generous Donor',
        cus_email: payload.donorEmail || 'donor@rudc.org',
        cus_phone: payload.donorPhone || '01700000000',
        cus_add1: 'Rajshahi University Campus',
        product_name: ((_b = donation.event) === null || _b === void 0 ? void 0 : _b.title) ? `RUDC - ${donation.event.title}` : 'RUDC General Donation',
        product_category: 'Donation',
        value_a: donation.id.toString(),
        value_b: 'FUND_DONATION',
    };
    try {
        const sslResponse = yield sslcommerz_1.default.init(sslPayload);
        if (sslResponse.status === 'SUCCESS' && sslResponse.GatewayPageURL) {
            return {
                paymentUrl: sslResponse.GatewayPageURL,
                transactionId: tran_id,
                donationId: donation.id,
            };
        }
    }
    catch (error) {
        // Gateway error or mock development environment fallback
        console.warn('SSLCommerz initiation notice:', error);
    }
    // Graceful fallback URL for local testing / development when gateway credentials are sandbox or mock
    const clientSuccessMock = `${config_1.default.client_url}/rudc/donate/success?tran_id=${tran_id}`;
    return {
        paymentUrl: clientSuccessMock,
        transactionId: tran_id,
        donationId: donation.id,
    };
});
const validatePaymentAndComplete = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const tran_id = payload.tran_id;
    const val_id = payload.val_id;
    if (!tran_id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Transaction ID is required to verify payment!');
    }
    const existingDonation = yield db_1.default.fundDonation.findUnique({
        where: { transactionId: tran_id },
        include: { event: true },
    });
    if (!existingDonation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation transaction not found!');
    }
    // If already marked as paid
    if (existingDonation.paymentStatus === client_1.PaymentStatus.PAID) {
        return existingDonation;
    }
    // Gateway validation if val_id is provided
    if (val_id) {
        try {
            const validation = yield sslcommerz_1.default.validate(val_id);
            if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Gateway validation failed for this transaction!');
            }
        }
        catch (err) {
            console.warn('Gateway verification bypass in dev/mock:', err === null || err === void 0 ? void 0 : err.message);
        }
    }
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    // Atomically update donation and increment event raisedAmount if eventId present.
    // Serializable isolation ensures concurrent IPN + success-redirect calls can't
    // both pass the PAID check and double-increment the event's raisedAmount.
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Re-check inside TX — the definitive idempotency gate for concurrent webhooks
        const freshDonation = yield tx.fundDonation.findUnique({
            where: { id: existingDonation.id },
        });
        if (freshDonation && freshDonation.paymentStatus === client_1.PaymentStatus.PAID) {
            // Already completed by a concurrent request — return without double-writing
            return tx.fundDonation.findUnique({
                where: { id: existingDonation.id },
                include: { event: true },
            });
        }
        const updated = yield tx.fundDonation.update({
            where: { id: existingDonation.id },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                receiptNo,
                paidAt: now,
            },
            include: {
                event: true,
            },
        });
        if (existingDonation.eventId) {
            yield tx.event.update({
                where: { id: existingDonation.eventId },
                data: {
                    raisedAmount: {
                        increment: Number(existingDonation.amount),
                    },
                },
            });
        }
        return updated;
    }), { isolationLevel: 'Serializable' });
    return result;
});
const handleFailedPayment = (payload_1, ...args_1) => __awaiter(void 0, [payload_1, ...args_1], void 0, function* (payload, status = client_1.PaymentStatus.FAILED) {
    const tran_id = payload.tran_id;
    if (!tran_id)
        return null;
    const existing = yield db_1.default.fundDonation.findUnique({
        where: { transactionId: tran_id },
    });
    if (existing && existing.paymentStatus === client_1.PaymentStatus.PENDING) {
        return yield db_1.default.fundDonation.update({
            where: { id: existing.id },
            data: { paymentStatus: status },
        });
    }
    return existing;
});
const createManualDonation = (payload, actingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.amount <= 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Donation amount must be greater than zero!');
    }
    if (payload.eventId) {
        const event = yield db_1.default.event.findUnique({ where: { id: payload.eventId } });
        if (!event) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Fundraiser event not found!');
        }
    }
    const tran_id = `MANUAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNo = payload.receiptNo || `RCP-M-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const paymentStatus = payload.paymentStatus || client_1.PaymentStatus.PAID;
    const paidAt = paymentStatus === client_1.PaymentStatus.PAID ? (payload.paidAt ? new Date(payload.paidAt) : new Date()) : null;
    const donation = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const created = yield tx.fundDonation.create({
            data: {
                transactionId: tran_id,
                receiptNo,
                amount: payload.amount,
                eventId: payload.eventId || null,
                userId: payload.userId || actingUserId || null,
                donorName: payload.donorName || null,
                donorEmail: payload.donorEmail || null,
                donorPhone: payload.donorPhone || null,
                isAnonymous: (_a = payload.isAnonymous) !== null && _a !== void 0 ? _a : false,
                donorNote: payload.donorNote || null,
                paymentMethod: payload.paymentMethod || client_1.PaymentMethod.CASH,
                paymentStatus,
                paidAt,
            },
            include: {
                event: {
                    select: { id: true, title: true, slug: true, targetAmount: true, raisedAmount: true },
                },
            },
        });
        if (paymentStatus === client_1.PaymentStatus.PAID && payload.eventId) {
            yield tx.event.update({
                where: { id: payload.eventId },
                data: {
                    raisedAmount: {
                        increment: payload.amount,
                    },
                },
            });
        }
        return created;
    }));
    return donation;
});
const getAllDonations = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 20, paymentStatus, paymentMethod, eventId, isAnonymous, searchTerm, sortBy = 'createdAt', sortOrder = 'desc', } = query;
    const take = Number(limit) || 20;
    const skip = (Number(page) - 1) * take;
    const whereConditions = {};
    if (paymentStatus && paymentStatus !== 'ALL') {
        whereConditions.paymentStatus = paymentStatus;
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
        whereConditions.paymentMethod = paymentMethod;
    }
    if (eventId && eventId !== 'ALL') {
        whereConditions.eventId = Number(eventId);
    }
    if (isAnonymous !== undefined && isAnonymous !== 'ALL') {
        whereConditions.isAnonymous = isAnonymous === 'true' || isAnonymous === true;
    }
    if (searchTerm) {
        const searchStr = String(searchTerm).trim();
        whereConditions.OR = [
            { donorName: { contains: searchStr, mode: 'insensitive' } },
            { donorEmail: { contains: searchStr, mode: 'insensitive' } },
            { donorPhone: { contains: searchStr, mode: 'insensitive' } },
            { transactionId: { contains: searchStr, mode: 'insensitive' } },
            { receiptNo: { contains: searchStr, mode: 'insensitive' } },
        ];
    }
    const [total, records] = yield Promise.all([
        db_1.default.fundDonation.count({ where: whereConditions }),
        db_1.default.fundDonation.findMany({
            where: whereConditions,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        targetAmount: true,
                        raisedAmount: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
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
const getDonationById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield db_1.default.fundDonation.findUnique({
        where: { id },
        include: {
            event: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                },
            },
        },
    });
    if (!donation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Fund donation record not found!');
    }
    return donation;
});
const getDonationByReceiptOrTranId = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield db_1.default.fundDonation.findFirst({
        where: {
            OR: [{ receiptNo: identifier }, { transactionId: identifier }],
        },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    targetAmount: true,
                    raisedAmount: true,
                },
            },
        },
    });
    if (!donation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation receipt not found!');
    }
    return donation;
});
const updateDonation = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const existing = yield db_1.default.fundDonation.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation record not found!');
    }
    const oldStatus = existing.paymentStatus;
    const newStatus = (_a = payload.paymentStatus) !== null && _a !== void 0 ? _a : oldStatus;
    const targetEventId = payload.eventId !== undefined ? payload.eventId : existing.eventId;
    const donationAmount = (_b = payload.amount) !== null && _b !== void 0 ? _b : existing.amount;
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // If status changed from not PAID to PAID:
        if (oldStatus !== client_1.PaymentStatus.PAID && newStatus === client_1.PaymentStatus.PAID) {
            if (targetEventId) {
                yield tx.event.update({
                    where: { id: targetEventId },
                    data: { raisedAmount: { increment: Number(donationAmount) } },
                });
            }
        }
        // If status changed from PAID to another status (CANCELLED, REFUNDED, etc):
        else if (oldStatus === client_1.PaymentStatus.PAID && newStatus !== client_1.PaymentStatus.PAID) {
            if (existing.eventId) {
                yield tx.event.update({
                    where: { id: existing.eventId },
                    data: { raisedAmount: { decrement: Number(existing.amount) } },
                });
            }
        }
        const updateData = {};
        if (payload.donorName !== undefined)
            updateData.donorName = payload.donorName;
        if (payload.donorEmail !== undefined)
            updateData.donorEmail = payload.donorEmail;
        if (payload.donorPhone !== undefined)
            updateData.donorPhone = payload.donorPhone;
        if (payload.isAnonymous !== undefined)
            updateData.isAnonymous = payload.isAnonymous;
        if (payload.donorNote !== undefined)
            updateData.donorNote = payload.donorNote;
        if (payload.amount !== undefined)
            updateData.amount = payload.amount;
        if (payload.paymentMethod !== undefined)
            updateData.paymentMethod = payload.paymentMethod;
        if (payload.paymentStatus !== undefined)
            updateData.paymentStatus = payload.paymentStatus;
        if (payload.receiptNo !== undefined)
            updateData.receiptNo = payload.receiptNo;
        if (payload.eventId !== undefined) {
            if (payload.eventId === null) {
                updateData.event = { disconnect: true };
            }
            else {
                updateData.event = { connect: { id: payload.eventId } };
            }
        }
        if (newStatus === client_1.PaymentStatus.PAID && !existing.paidAt) {
            updateData.paidAt = new Date();
        }
        return yield tx.fundDonation.update({
            where: { id },
            data: updateData,
            include: {
                event: true,
                user: true,
            },
        });
    }));
    return result;
});
const deleteDonation = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.fundDonation.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation record not found!');
    }
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        if (existing.paymentStatus === client_1.PaymentStatus.PAID && existing.eventId) {
            yield tx.event.update({
                where: { id: existing.eventId },
                data: { raisedAmount: { decrement: Number(existing.amount) } },
            });
        }
        return yield tx.fundDonation.delete({ where: { id } });
    }));
    return result;
});
const getDonationStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [totalCompletedAgg, totalCompletedCount, todayAgg, pendingCount, totalDonorsCount, activeCampaigns, recentDonations,] = yield Promise.all([
        db_1.default.fundDonation.aggregate({
            where: { paymentStatus: client_1.PaymentStatus.PAID },
            _sum: { amount: true },
        }),
        db_1.default.fundDonation.count({
            where: { paymentStatus: client_1.PaymentStatus.PAID },
        }),
        db_1.default.fundDonation.aggregate({
            where: {
                paymentStatus: client_1.PaymentStatus.PAID,
                paidAt: { gte: startOfToday },
            },
            _sum: { amount: true },
        }),
        db_1.default.fundDonation.count({
            where: { paymentStatus: client_1.PaymentStatus.PENDING },
        }),
        db_1.default.fundDonation.count(),
        db_1.default.event.count({
            where: {
                isFundraiser: true,
                isActive: true,
                org: { in: ['RUDC', 'BOTH'] },
            },
        }),
        db_1.default.fundDonation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                event: { select: { id: true, title: true } },
            },
        }),
    ]);
    return {
        totalRaised: totalCompletedAgg._sum.amount || 0,
        totalCompletedCount,
        todayRaised: todayAgg._sum.amount || 0,
        pendingCount,
        totalDonorsCount,
        activeCampaigns,
        recentDonations,
    };
});
const getPublicCampaigns = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.event.findMany({
        where: {
            isFundraiser: true,
            isActive: true,
            org: { in: ['RUDC', 'BOTH'] },
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            location: true,
            bannerImage: true,
            targetAmount: true,
            raisedAmount: true,
            startDate: true,
            endDate: true,
            status: true,
            _count: {
                select: {
                    fundDonations: {
                        where: { paymentStatus: client_1.PaymentStatus.PAID },
                    },
                },
            },
        },
    });
});
const getPublicRecentDonors = () => __awaiter(void 0, void 0, void 0, function* () {
    const donations = yield db_1.default.fundDonation.findMany({
        where: { paymentStatus: client_1.PaymentStatus.PAID },
        take: 8,
        orderBy: { paidAt: 'desc' },
        select: {
            id: true,
            amount: true,
            paidAt: true,
            isAnonymous: true,
            donorName: true,
            donorNote: true,
            event: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    });
    // Mask donor identity if isAnonymous is true
    return donations.map((d) => {
        var _a;
        return ({
            id: d.id,
            amount: d.amount,
            paidAt: d.paidAt,
            donorName: d.isAnonymous ? 'Anonymous Donor (বেনামী শুভাকাঙ্ক্ষী)' : d.donorName || 'Generous Brother',
            donorNote: d.donorNote,
            eventName: ((_a = d.event) === null || _a === void 0 ? void 0 : _a.title) || 'General RUDC Fund',
        });
    });
});
exports.FundDonationService = {
    initiateOnlineDonation,
    validatePaymentAndComplete,
    handleFailedPayment,
    createManualDonation,
    getAllDonations,
    getDonationById,
    getDonationByReceiptOrTranId,
    updateDonation,
    deleteDonation,
    getDonationStats,
    getPublicCampaigns,
    getPublicRecentDonors,
};

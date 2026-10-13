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
exports.BkashController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const bkash_1 = require("../../../lib/bkash");
const client_1 = require("@prisma/client");
const socket_1 = require("../../../lib/socket");
const getBkashInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'bKash information retrieved successfully!',
        data: {
            personalNumber: bkash_1.BKASH_PERSONAL_ACCOUNT, // 01601704112
            formattedPersonalNumber: '+880 1601-704112',
            isMerchantConfigured: (0, bkash_1.isBkashMerchantConfigured)(),
            instructions: [
                `Go to your bKash App or dial *247#`,
                `Select 'Send Money' option`,
                `Enter recipient number: ${bkash_1.BKASH_PERSONAL_ACCOUNT}`,
                `Enter the exact payable amount`,
                `Use your Order / Member Reference as reference note`,
                `Complete payment and copy the TrxID (Transaction ID)`,
                `Enter your Sender Phone number & TrxID on the checkout/payment page`,
            ],
        },
    });
}));
const initiatePayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { purpose, referenceId, amount, callbackUrl, payerReference } = req.body;
    if (!purpose || !amount) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payment purpose and amount are required!');
    }
    const invoiceNumber = `${purpose}-${referenceId || Date.now()}`;
    const result = yield (0, bkash_1.createBkashPayment)({
        amount: Number(amount),
        invoiceNumber,
        payerReference: payerReference || 'RUIL',
        callbackUrl,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'bKash payment session initialized successfully!',
        data: result,
    });
}));
const completePayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentID, purpose, referenceId } = req.body;
    if (!paymentID) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'paymentID is required to execute payment!');
    }
    const result = yield (0, bkash_1.executeBkashPayment)(paymentID);
    if (result.statusCode !== '0000' || result.transactionStatus !== 'Completed') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, result.statusMessage || 'bKash payment execution was not successful!');
    }
    const trxID = result.trxID || `TRX_${Date.now()}`;
    // Automatically update the matching business model
    if (purpose === 'ORDER' && referenceId) {
        const order = yield db_1.default.order.findFirst({
            where: {
                OR: [{ id: Number(referenceId) || 0 }, { orderCode: String(referenceId) }],
            },
        });
        if (order) {
            yield db_1.default.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: client_1.PaymentStatus.PAID,
                    paymentVerified: true,
                    verifiedAt: new Date(),
                    customerTrxId: trxID,
                    orderStatus: client_1.OrderStatus.PROCESSING,
                },
            });
            (0, socket_1.emitOrderStatusUpdate)(order.orderCode, {
                orderStatus: client_1.OrderStatus.PROCESSING,
                paymentStatus: client_1.PaymentStatus.PAID,
                paymentVerified: true,
            });
        }
    }
    else if (purpose === 'MEMBERSHIP' && referenceId) {
        const user = yield db_1.default.user.findUnique({
            where: { id: Number(referenceId) },
        });
        if (user) {
            const now = new Date();
            const expires = new Date(now);
            expires.setFullYear(expires.getFullYear() + 1);
            yield db_1.default.$transaction([
                db_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        status: client_1.UserStatus.ACTIVE,
                        isPaid: true,
                        membershipStartedAt: now,
                        membershipExpiresAt: expires,
                    },
                }),
                db_1.default.payment.create({
                    data: {
                        transactionId: trxID,
                        userId: user.id,
                        amount: Number(result.amount) || 500,
                        paymentMethod: 'BKASH',
                        status: client_1.PaymentStatus.COMPLETED,
                        paidAt: now,
                        customerTrxId: trxID,
                    },
                }),
            ]);
        }
    }
    else if (purpose === 'IYANOT' && referenceId) {
        yield db_1.default.rudcIyanot.update({
            where: { id: Number(referenceId) },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                transactionId: trxID,
            },
        });
    }
    else if (purpose === 'DONATION' && referenceId) {
        yield db_1.default.fundDonation.update({
            where: { id: Number(referenceId) },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                paidAt: new Date(),
                receiptNo: trxID,
            },
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'bKash payment executed and registered successfully!',
        data: Object.assign(Object.assign({}, result), { trxID }),
    });
}));
const submitPersonalPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { purpose, referenceId, senderPhone, trxID, amount } = req.body;
    if (!purpose || !senderPhone || !trxID) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Purpose, senderPhone, and trxID are required!');
    }
    const cleanTrxID = String(trxID).trim().toUpperCase();
    const cleanPhone = String(senderPhone).trim();
    const roundAmount = Math.round(Number(amount) || 0);
    let updatedRecord = null;
    if (purpose === 'ORDER' && referenceId) {
        const order = yield db_1.default.order.findFirst({
            where: {
                OR: [{ id: Number(referenceId) || 0 }, { orderCode: String(referenceId) }],
            },
        });
        if (!order) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
        }
        updatedRecord = yield db_1.default.order.update({
            where: { id: order.id },
            data: {
                mfsProvider: 'BKASH',
                senderPhone: cleanPhone,
                customerTrxId: cleanTrxID,
                paymentStatus: client_1.PaymentStatus.PENDING,
            },
        });
        (0, socket_1.emitOrderStatusUpdate)(order.orderCode, {
            paymentStatus: client_1.PaymentStatus.PENDING,
            customerTrxId: cleanTrxID,
        });
    }
    else if (purpose === 'MEMBERSHIP' && referenceId) {
        const user = yield db_1.default.user.findUnique({
            where: { id: Number(referenceId) },
        });
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Member not found!');
        }
        const txnId = `BKASH-${Date.now()}`;
        const payment = yield db_1.default.payment.create({
            data: {
                transactionId: txnId,
                userId: user.id,
                amount: roundAmount || 500,
                paymentMethod: 'BKASH',
                mfsProvider: 'BKASH',
                senderPhone: cleanPhone,
                customerTrxId: cleanTrxID,
                status: client_1.PaymentStatus.PENDING,
            },
        });
        updatedRecord = { user, payment };
    }
    else if (purpose === 'IYANOT' && referenceId) {
        const iyanot = yield db_1.default.rudcIyanot.findUnique({
            where: { id: Number(referenceId) },
        });
        if (!iyanot) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Iyanot record not found!');
        }
        updatedRecord = yield db_1.default.rudcIyanot.update({
            where: { id: iyanot.id },
            data: {
                paymentMethod: 'ONLINE',
                transactionId: cleanTrxID,
                status: 'PENDING',
            },
        });
    }
    else if (purpose === 'DONATION' && referenceId) {
        const donation = yield db_1.default.fundDonation.findUnique({
            where: { id: Number(referenceId) },
        });
        if (!donation) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation record not found!');
        }
        updatedRecord = yield db_1.default.fundDonation.update({
            where: { id: donation.id },
            data: {
                paymentMethod: 'BKASH',
                receiptNo: cleanTrxID,
                donorPhone: cleanPhone,
                paymentStatus: client_1.PaymentStatus.PENDING,
            },
        });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Personal bKash transaction submitted for verification!',
        data: {
            purpose,
            referenceId,
            senderPhone: cleanPhone,
            trxID: cleanTrxID,
            amount: roundAmount,
            record: updatedRecord,
        },
    });
}));
exports.BkashController = {
    getBkashInfo,
    initiatePayment,
    completePayment,
    submitPersonalPayment,
};

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
exports.PaymentService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const sslcommerz_1 = __importDefault(require("../../../lib/sslcommerz"));
const initiateMembershipPayment = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const membershipAmount = amount || 500;
    const tran_id = `MEM-${user.id}-${Date.now()}`;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';
    const sslPayload = {
        total_amount: membershipAmount,
        tran_id,
        success_url: `${baseUrl}/payments/success`,
        fail_url: `${baseUrl}/payments/fail`,
        cancel_url: `${baseUrl}/payments/cancel`,
        ipn_url: `${baseUrl}/payments/ipn`,
        cus_name: user.name,
        cus_email: user.email,
        cus_phone: user.phone,
        cus_add1: user.institution || 'Rajshahi University',
        product_name: 'RUIL Library Membership Subscription',
        product_category: 'Membership',
        value_a: user.id.toString(),
        value_b: 'MEMBERSHIP',
    };
    const sslResponse = yield sslcommerz_1.default.init(sslPayload);
    if (sslResponse.status !== 'SUCCESS' || !sslResponse.GatewayPageURL) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, sslResponse.failedreason || 'SSLCommerz payment gateway initialization failed!');
    }
    return {
        paymentUrl: sslResponse.GatewayPageURL,
        transactionId: tran_id,
    };
});
const validatePaymentAndActivate = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const val_id = payload.val_id;
    const tran_id = payload.tran_id;
    if (val_id) {
        const validation = yield sslcommerz_1.default.validate(val_id);
        if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Transaction validation failed with SSLCommerz!');
        }
    }
    else if (payload.status !== 'VALID' && payload.status !== 'VALIDATED') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payment was not marked as valid by gateway!');
    }
    // Handle membership payment transaction
    const isMembership = payload.value_b === 'MEMBERSHIP' || (tran_id && tran_id.startsWith('MEM-'));
    const userId = payload.value_a
        ? Number(payload.value_a)
        : tran_id && tran_id.startsWith('MEM-')
            ? Number(tran_id.split('-')[1])
            : null;
    if (isMembership && userId) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const paidAmount = payload.amount ? Number(payload.amount) : 500;
        const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const updatedUser = yield tx.user.update({
                where: { id: userId },
                data: {
                    status: client_1.UserStatus.ACTIVE,
                    isPaid: true,
                    paymentMethod: client_1.PaymentMethod.ONLINE,
                    membershipStartedAt: now,
                    membershipExpiresAt: expiresAt,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                    isPaid: true,
                    paymentMethod: true,
                    membershipStartedAt: true,
                    membershipExpiresAt: true,
                },
            });
            const paymentRecord = yield tx.payment.create({
                data: {
                    transactionId: tran_id || `ONLINE-MEM-${userId}-${now.getTime()}`,
                    userId,
                    amount: paidAmount,
                    paymentMethod: client_1.PaymentMethod.ONLINE,
                    status: client_1.PaymentStatus.COMPLETED,
                    paidAt: now,
                },
            });
            return { user: updatedUser, payment: paymentRecord };
        }));
        return {
            type: 'MEMBERSHIP',
            user: result.user,
            payment: result.payment,
            message: 'Membership activated successfully for 1 year!',
        };
    }
    // Handle purchase order transaction
    if (tran_id && tran_id.startsWith('TXN-')) {
        const updatedPurchase = yield db_1.default.purchase.update({
            where: { transactionId: tran_id },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                orderStatus: client_1.OrderStatus.PROCESSING,
            },
            include: {
                book: true,
            },
        });
        return {
            type: 'PURCHASE',
            purchase: updatedPurchase,
            message: 'Purchase payment completed successfully!',
        };
    }
    return {
        message: 'Payment validated successfully!',
        tran_id,
    };
});
const handleFailedPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const tran_id = payload.tran_id;
    if (tran_id && tran_id.startsWith('TXN-')) {
        const existing = yield db_1.default.purchase.findUnique({
            where: { transactionId: tran_id },
        });
        if (existing) {
            const updatedPurchase = yield db_1.default.purchase.update({
                where: { transactionId: tran_id },
                data: {
                    paymentStatus: client_1.PaymentStatus.FAILED,
                    orderStatus: client_1.OrderStatus.CANCELLED,
                },
            });
            return {
                type: 'PURCHASE',
                purchase: updatedPurchase,
                message: 'Purchase payment failed and order was cancelled.',
            };
        }
    }
    return {
        message: 'Payment transaction failed or was cancelled.',
        tran_id,
    };
});
exports.PaymentService = {
    initiateMembershipPayment,
    validatePaymentAndActivate,
    handleFailedPayment,
};

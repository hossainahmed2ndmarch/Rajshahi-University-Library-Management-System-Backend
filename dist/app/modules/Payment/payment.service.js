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
    var _a;
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
        include: { academicProfile: true },
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
        cus_add1: ((_a = user.academicProfile) === null || _a === void 0 ? void 0 : _a.institution) || 'Rajshahi University',
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
    // ─── Idempotency guard ────────────────────────────────────────────────────
    // SSLCommerz can fire both the success redirect AND the IPN webhook for the
    // same transaction. If we've already recorded a COMPLETED payment for this
    // tran_id, return the existing record immediately to avoid duplicate
    // membership activations or purchase status flips.
    if (tran_id) {
        const existingPayment = yield db_1.default.payment.findUnique({
            where: { transactionId: tran_id },
        });
        if (existingPayment && existingPayment.status === client_1.PaymentStatus.COMPLETED) {
            return {
                type: 'ALREADY_PROCESSED',
                message: 'Payment was already processed successfully.',
                payment: existingPayment,
            };
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
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
    // tran_id format: MEM-<userId>-<timestamp>
    const isMembership = payload.value_b === 'MEMBERSHIP' || (tran_id && tran_id.startsWith('MEM-'));
    const userId = payload.value_a
        ? String(payload.value_a)
        : tran_id && tran_id.startsWith('MEM-')
            ? tran_id.split('-')[1] // e.g. "MEM-clxxx123-1234567890" → "clxxx123"
            : null;
    if (isMembership && userId) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const paidAmount = payload.amount ? Number(payload.amount) : 500;
        // Wrap in a serializable transaction so that concurrent webhook deliveries
        // cannot both execute the user-update + payment-create pair.
        const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Re-check idempotency inside the transaction (handles concurrent webhooks)
            const existingInTx = tran_id
                ? yield tx.payment.findUnique({ where: { transactionId: tran_id } })
                : null;
            if (existingInTx && existingInTx.status === client_1.PaymentStatus.COMPLETED) {
                return { alreadyProcessed: true, payment: existingInTx };
            }
            // Activate the user account status
            const updatedUser = yield tx.user.update({
                where: { id: userId },
                data: {
                    status: client_1.UserStatus.ACTIVE,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                },
            });
            // Update the RuilMemberProfile with payment details
            yield tx.ruilMemberProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    isPaid: true,
                    paymentMethod: client_1.PaymentMethod.ONLINE,
                    membershipStartedAt: now,
                    membershipExpiresAt: expiresAt,
                    membershipStatus: client_1.UserStatus.ACTIVE,
                },
                update: {
                    isPaid: true,
                    paymentMethod: client_1.PaymentMethod.ONLINE,
                    membershipStartedAt: now,
                    membershipExpiresAt: expiresAt,
                    membershipStatus: client_1.UserStatus.ACTIVE,
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
            return { alreadyProcessed: false, user: updatedUser, payment: paymentRecord };
        }), { isolationLevel: 'Serializable' });
        if (result.alreadyProcessed) {
            return {
                type: 'ALREADY_PROCESSED',
                message: 'Payment was already processed successfully.',
                payment: result.payment,
            };
        }
        return {
            type: 'MEMBERSHIP',
            user: result.user,
            payment: result.payment,
            message: 'Membership activated successfully for 1 year!',
        };
    }
    // Handle purchase/order transaction (tran_id starts with 'TXN-' or 'ORD-')
    if (tran_id && (tran_id.startsWith('TXN-') || tran_id.startsWith('ORD-'))) {
        // Idempotency: if already PAID, skip re-processing
        const existingOrder = yield db_1.default.order.findFirst({
            where: { transactionId: tran_id },
            include: { items: { include: { book: true } } },
        });
        if (!existingOrder) {
            return { message: 'Order not found for this transaction.', tran_id };
        }
        if (existingOrder.paymentStatus === client_1.PaymentStatus.PAID) {
            return {
                type: 'ALREADY_PROCESSED',
                order: existingOrder,
                message: 'Order payment was already marked as paid.',
            };
        }
        const updatedOrder = yield db_1.default.order.update({
            where: { id: existingOrder.id },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                orderStatus: client_1.OrderStatus.PROCESSING,
            },
            include: {
                items: { include: { book: true } },
            },
        });
        return {
            type: 'ORDER',
            order: updatedOrder,
            message: 'Order payment completed successfully!',
        };
    }
    return {
        message: 'Payment validated successfully!',
        tran_id,
    };
});
const handleFailedPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const tran_id = payload.tran_id;
    if (tran_id && (tran_id.startsWith('TXN-') || tran_id.startsWith('ORD-'))) {
        const existing = yield db_1.default.order.findFirst({
            where: { transactionId: tran_id },
        });
        if (existing) {
            const updatedOrder = yield db_1.default.order.update({
                where: { id: existing.id },
                data: {
                    paymentStatus: client_1.PaymentStatus.FAILED,
                    orderStatus: client_1.OrderStatus.CANCELLED,
                },
            });
            return {
                type: 'ORDER',
                order: updatedOrder,
                message: 'Order payment failed and order was cancelled.',
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

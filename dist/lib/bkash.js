"use strict";
/**
 * bKash Payment Integration (Tokenized Checkout API v1.2.0-beta)
 *
 * Supports:
 * 1. Personal Send Money Manual Flow (Account: 01601704112 / +880 1601-704112)
 * 2. bKash Merchant Tokenized Online Checkout API (Sandbox / Live)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryBkashPayment = exports.executeBkashPayment = exports.createBkashPayment = exports.grantBkashToken = exports.isBkashMerchantConfigured = exports.BKASH_PERSONAL_ACCOUNT = void 0;
let cachedIdToken = null;
let tokenExpiresAt = 0;
exports.BKASH_PERSONAL_ACCOUNT = process.env.BKASH_PERSONAL_NUMBER || '01601704112';
const isSandbox = (process.env.BKASH_IS_SANDBOX || 'true').toLowerCase() === 'true';
const BASE_URL = isSandbox
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
const isBkashMerchantConfigured = () => {
    return Boolean(process.env.BKASH_APP_KEY &&
        process.env.BKASH_APP_SECRET &&
        process.env.BKASH_USERNAME &&
        process.env.BKASH_PASSWORD);
};
exports.isBkashMerchantConfigured = isBkashMerchantConfigured;
/**
 * Grants or retrieves a valid tokenized bKash session token
 */
const grantBkashToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    if (cachedIdToken && tokenExpiresAt > now + 60000) {
        return cachedIdToken;
    }
    if (!(0, exports.isBkashMerchantConfigured)()) {
        console.warn('⚠️ [bKash Merchant] API credentials not configured in .env. Returning simulated token.');
        cachedIdToken = `SIMULATED_BKASH_TOKEN_${Date.now()}`;
        tokenExpiresAt = now + 3600 * 1000;
        return cachedIdToken;
    }
    try {
        const response = yield fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                username: process.env.BKASH_USERNAME,
                password: process.env.BKASH_PASSWORD,
            },
            body: JSON.stringify({
                app_key: process.env.BKASH_APP_KEY,
                app_secret: process.env.BKASH_APP_SECRET,
            }),
        });
        const data = (yield response.json());
        if (data.id_token) {
            cachedIdToken = data.id_token;
            tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
            return cachedIdToken;
        }
        else {
            throw new Error(data.statusMessage || 'Failed to grant bKash token');
        }
    }
    catch (error) {
        console.error('❌ [bKash Token Error]:', error);
        throw error;
    }
});
exports.grantBkashToken = grantBkashToken;
/**
 * Creates a bKash Checkout URL for customer redirection
 */
const createBkashPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.isBkashMerchantConfigured)()) {
        const simPaymentId = `BK_SIM_${Date.now()}`;
        const defaultCallback = payload.callbackUrl ||
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/bkash/callback`;
        return {
            statusCode: '0000',
            statusMessage: 'Simulated Merchant Payment Session Created',
            paymentID: simPaymentId,
            bkashURL: `${defaultCallback}?paymentID=${simPaymentId}&status=success`,
            amount: payload.amount.toString(),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: payload.invoiceNumber,
        };
    }
    const token = yield (0, exports.grantBkashToken)();
    const callbackUrl = payload.callbackUrl ||
        process.env.BKASH_CALLBACK_URL ||
        `${process.env.BACKEND_URL || 'http://localhost:5000/api/v1'}/bkash/callback`;
    const requestBody = {
        mode: '0011',
        payerReference: payload.payerReference || 'RUIL_PATRON',
        callbackURL: callbackUrl,
        amount: payload.amount.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: payload.invoiceNumber,
    };
    const response = yield fetch(`${BASE_URL}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
        body: JSON.stringify(requestBody),
    });
    const data = (yield response.json());
    return data;
});
exports.createBkashPayment = createBkashPayment;
/**
 * Executes a bKash payment after customer confirms with PIN on gateway
 */
const executeBkashPayment = (paymentID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.isBkashMerchantConfigured)() || paymentID.startsWith('BK_SIM_')) {
        return {
            statusCode: '0000',
            statusMessage: 'Successful',
            paymentID,
            trxID: `TRX_SIM_${Date.now()}`,
            transactionStatus: 'Completed',
            amount: '500.00',
            currency: 'BDT',
            intent: 'sale',
            paymentExecuteTime: new Date().toISOString(),
        };
    }
    const token = yield (0, exports.grantBkashToken)();
    const response = yield fetch(`${BASE_URL}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
    });
    const data = (yield response.json());
    return data;
});
exports.executeBkashPayment = executeBkashPayment;
/**
 * Queries payment status from bKash server
 */
const queryBkashPayment = (paymentID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.isBkashMerchantConfigured)() || paymentID.startsWith('BK_SIM_')) {
        return {
            statusCode: '0000',
            statusMessage: 'Completed',
            paymentID,
            transactionStatus: 'Completed',
        };
    }
    const token = yield (0, exports.grantBkashToken)();
    const response = yield fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: token,
            'X-APP-Key': process.env.BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
    });
    return yield response.json();
});
exports.queryBkashPayment = queryBkashPayment;

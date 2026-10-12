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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSteadfastTracking = exports.createSteadfastOrder = void 0;
const STEADFAST_BASE_URL = process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.courier/api/v1';
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY || '';
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY || '';
/**
 * Creates a parcel delivery shipment via Steadfast Courier REST API
 */
const createSteadfastOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
        // If API credentials not configured yet, return mock consignment for development
        console.warn('⚠️ STEADFAST_API_KEY / STEADFAST_SECRET_KEY not set in .env. Returning simulated consignment.');
        return {
            status: 200,
            message: 'Simulated Steadfast order created (credentials not set)',
            consignment: {
                consignment_id: Math.floor(100000 + Math.random() * 900000),
                invoice: payload.invoice,
                tracking_code: `STDF-${Date.now().toString().slice(-6)}`,
                recipient_name: payload.recipient_name,
                recipient_phone: payload.recipient_phone,
                recipient_address: payload.recipient_address,
                cod_amount: payload.cod_amount,
                status: 'in_review',
            },
        };
    }
    const response = yield fetch(`${STEADFAST_BASE_URL}/create_order`, {
        method: 'POST',
        headers: {
            'Api-Key': STEADFAST_API_KEY,
            'Secret-Key': STEADFAST_SECRET_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return (yield response.json());
});
exports.createSteadfastOrder = createSteadfastOrder;
/**
 * Checks real-time parcel delivery status from Steadfast Courier
 */
const checkSteadfastTracking = (trackingCode) => __awaiter(void 0, void 0, void 0, function* () {
    if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
        return {
            status: 200,
            delivery_status: 'in_review',
        };
    }
    try {
        const response = yield fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, {
            method: 'GET',
            headers: {
                'Api-Key': STEADFAST_API_KEY,
                'Secret-Key': STEADFAST_SECRET_KEY,
            },
        });
        return (yield response.json());
    }
    catch (error) {
        console.error('Failed to fetch Steadfast tracking status:', error);
        return null;
    }
});
exports.checkSteadfastTracking = checkSteadfastTracking;

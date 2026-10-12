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
exports.CouponService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const createCouponInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedCode = payload.code.trim().toUpperCase();
    const existing = yield db_1.default.coupon.findUnique({
        where: { code: normalizedCode },
    });
    if (existing) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, `Coupon with code "${normalizedCode}" already exists!`);
    }
    const result = yield db_1.default.coupon.create({
        data: Object.assign(Object.assign({}, payload), { code: normalizedCode, expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null }),
    });
    return result;
});
const getAllCouponsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.default.coupon.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return result;
});
const getCouponByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.default.coupon.findUnique({
        where: { id },
    });
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Coupon not found!');
    }
    return result;
});
const updateCouponInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.coupon.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Coupon not found!');
    }
    const updateData = Object.assign({}, payload);
    if (payload.code) {
        updateData.code = payload.code.trim().toUpperCase();
    }
    if (payload.expiresAt !== undefined) {
        updateData.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    }
    const result = yield db_1.default.coupon.update({
        where: { id },
        data: updateData,
    });
    return result;
});
const deleteCouponFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.coupon.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Coupon not found!');
    }
    yield db_1.default.coupon.delete({ where: { id } });
    return true;
});
/**
 * Validates a coupon code against a cart total and returns calculated discount
 */
const validateCouponInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedCode = payload.code.trim().toUpperCase();
    const coupon = yield db_1.default.coupon.findUnique({
        where: { code: normalizedCode },
    });
    if (!coupon || !coupon.isActive) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Invalid or inactive coupon code!');
    }
    // Check expiration
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This coupon code has expired!');
    }
    // Check global usage limit
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This coupon has reached its total usage limit!');
    }
    // Check minimum order amount requirement
    if (coupon.minOrderAmount != null && payload.cartTotal < coupon.minOrderAmount) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Minimum order amount of ৳${coupon.minOrderAmount} required to apply this coupon!`);
    }
    // Check per-user limit if userId is provided
    if (payload.userId && coupon.perUserLimit) {
        const userUsage = yield db_1.default.order.count({
            where: {
                userId: payload.userId,
                couponId: coupon.id,
            },
        });
        if (userUsage >= coupon.perUserLimit) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `You have already reached the maximum usage limit (${coupon.perUserLimit} time(s)) for this coupon!`);
        }
    }
    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === client_1.CouponDiscountType.PERCENTAGE) {
        discountAmount = (payload.cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount != null && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    }
    else {
        // FIXED_AMOUNT
        discountAmount = Math.min(coupon.discountValue, payload.cartTotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, Math.round((payload.cartTotal - discountAmount) * 100) / 100);
    return {
        couponId: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalTotal,
    };
});
exports.CouponService = {
    createCouponInDB,
    getAllCouponsFromDB,
    getCouponByIdFromDB,
    updateCouponInDB,
    deleteCouponFromDB,
    validateCouponInDB,
};

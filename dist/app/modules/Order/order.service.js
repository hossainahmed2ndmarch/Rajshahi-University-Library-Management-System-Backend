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
exports.OrderService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const steadfast_1 = require("../../../lib/steadfast");
const sms_1 = require("../../../lib/sms");
const socket_1 = require("../../../lib/socket");
const createOrderInDB = (payload, authUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const userId = authUserId || payload.userId || null;
    const customerName = (_a = payload.customerName) === null || _a === void 0 ? void 0 : _a.trim();
    const customerEmail = (_b = payload.customerEmail) === null || _b === void 0 ? void 0 : _b.trim();
    const customerPhone = (_c = payload.customerPhone) === null || _c === void 0 ? void 0 : _c.trim();
    const shippingAddress = ((_d = payload.shippingAddress) === null || _d === void 0 ? void 0 : _d.trim()) || 'Counter Pickup (RUIL Central Library)';
    const paymentMethod = payload.paymentMethod || client_1.PaymentMethod.CASH;
    if (!customerName || !customerEmail || !customerPhone) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Customer name, email, and phone are required!');
    }
    if (!payload.items || payload.items.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Order must contain at least one book item!');
    }
    // 1. Validate books & calculate subtotal
    const validatedItems = yield Promise.all(payload.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const book = yield db_1.default.book.findUnique({
            where: { id: item.bookId },
        });
        if (!book) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
        }
        if (book.type === client_1.BookType.BORROW_ONLY) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be purchased!`);
        }
        const sellPrice = book.sellPrice != null ? book.sellPrice.toNumber() : 0;
        if (sellPrice <= 0) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" does not have a valid sale price!`);
        }
        if (book.sellStock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for "${book.title}". Available: ${book.sellStock}, requested: ${item.quantity}.`);
        }
        const roundedUnitPrice = Math.round(sellPrice);
        const roundedTotalPrice = Math.round(roundedUnitPrice * item.quantity);
        return {
            book,
            quantity: item.quantity,
            unitPrice: roundedUnitPrice,
            totalPrice: roundedTotalPrice,
        };
    })));
    const subtotal = Math.round(validatedItems.reduce((sum, item) => sum + item.totalPrice, 0));
    // 2. Validate Coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;
    if ((_e = payload.couponCode) === null || _e === void 0 ? void 0 : _e.trim()) {
        const cleanCode = payload.couponCode.trim().toUpperCase();
        const coupon = yield db_1.default.coupon.findUnique({
            where: { code: cleanCode },
        });
        if (coupon && coupon.isActive) {
            const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
            const meetsMinOrder = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
            const underUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
            if (isNotExpired && meetsMinOrder && underUsageLimit) {
                if (coupon.discountType === 'PERCENTAGE') {
                    discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
                    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                        discountAmount = Math.round(coupon.maxDiscount);
                    }
                }
                else {
                    discountAmount = Math.round(Math.min(coupon.discountValue, subtotal));
                }
                appliedCoupon = coupon;
            }
        }
    }
    const rawDelivery = (_f = payload.deliveryCharge) !== null && _f !== void 0 ? _f : (payload.deliveryMethod === 'PICKUP' || payload.isPOSSale ? 0 : 60);
    const deliveryCharge = Math.round(rawDelivery);
    const totalAmount = Math.round(Math.max(0, subtotal - discountAmount + deliveryCharge));
    // Generate unique human-readable Order Code and Transaction Reference
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `ORD-${dateStr}-${randomSuffix}`;
    const transactionId = payload.customerTrxId || `TXN-${Date.now()}-${randomSuffix}`;
    // 3. Transactionally create normalized Order and OrderItems, and update inventory
    const createdOrder = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // Re-check inventory inside TX to prevent race conditions
        for (const item of validatedItems) {
            const fresh = yield tx.book.findUnique({ where: { id: item.book.id } });
            if (!fresh || fresh.sellStock < item.quantity) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for "${item.book.title}". Available: ${(_a = fresh === null || fresh === void 0 ? void 0 : fresh.sellStock) !== null && _a !== void 0 ? _a : 0}, requested: ${item.quantity}.`);
            }
            yield tx.book.update({
                where: { id: item.book.id },
                data: {
                    sellStock: {
                        decrement: item.quantity,
                    },
                },
            });
        }
        // If coupon applied, increment its usedCount
        if (appliedCoupon) {
            yield tx.coupon.update({
                where: { id: appliedCoupon.id },
                data: {
                    usedCount: {
                        increment: 1,
                    },
                },
            });
        }
        // Create Order
        const isMfs = ['BKASH', 'NAGAD', 'ROCKET'].includes(paymentMethod);
        const isOnlinePaid = paymentMethod === client_1.PaymentMethod.ONLINE;
        const order = yield tx.order.create({
            data: {
                orderCode,
                transactionId,
                userId,
                customerName,
                customerEmail,
                customerPhone,
                shippingAddress,
                deliveryMethod: payload.deliveryMethod || 'COURIER',
                deliveryCharge,
                subtotal,
                discountAmount,
                totalAmount,
                couponId: appliedCoupon ? appliedCoupon.id : null,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                orderStatus: payload.isPOSSale ? client_1.OrderStatus.DELIVERED : client_1.OrderStatus.PENDING,
                paymentStatus: payload.isPOSSale || isOnlinePaid ? client_1.PaymentStatus.PAID : client_1.PaymentStatus.PENDING,
                paymentMethod,
                mfsProvider: payload.mfsProvider || (isMfs ? paymentMethod : null),
                senderPhone: payload.senderPhone || null,
                customerTrxId: payload.customerTrxId || null,
                paymentVerified: payload.isPOSSale || isOnlinePaid,
                verifiedAt: payload.isPOSSale || isOnlinePaid ? new Date() : null,
                isPOSSale: Boolean(payload.isPOSSale),
                posNotes: payload.posNotes || null,
                items: {
                    create: validatedItems.map((item) => ({
                        bookId: item.book.id,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        book: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                coupon: true,
            },
        });
        return order;
    }), { isolationLevel: 'Serializable' });
    // Send Order Placed SMS Notification
    if (createdOrder.customerPhone) {
        (0, sms_1.sendSMS)(createdOrder.customerPhone, sms_1.SMSTemplates.orderPlaced(createdOrder.orderCode, createdOrder.totalAmount)).catch((e) => console.error('SMS notification error:', e));
    }
    // Real-time Socket.IO emission
    (0, socket_1.emitOrderStatusUpdate)(createdOrder.orderCode, {
        orderCode: createdOrder.orderCode,
        transactionId: createdOrder.transactionId,
        orderStatus: createdOrder.orderStatus,
        paymentStatus: createdOrder.paymentStatus,
        totalAmount: createdOrder.totalAmount,
    });
    return createdOrder;
});
const getAllOrdersFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryObj = Object.assign({}, query);
    const excludeFields = ['page', 'limit', 'sortBy', 'sortOrder', 'searchTerm', 'buyerType'];
    excludeFields.forEach((field) => delete queryObj[field]);
    const conditions = [];
    // Search filter
    if (query.searchTerm) {
        const search = String(query.searchTerm).trim();
        conditions.push({
            OR: [
                { orderCode: { contains: search, mode: 'insensitive' } },
                { transactionId: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search, mode: 'insensitive' } },
                { customerTrxId: { contains: search, mode: 'insensitive' } },
                { trackingNumber: { contains: search, mode: 'insensitive' } },
            ],
        });
    }
    // Buyer type filter (MEMBER vs GUEST)
    if (query.buyerType === 'MEMBER') {
        conditions.push({ userId: { not: null } });
    }
    else if (query.buyerType === 'GUEST') {
        conditions.push({ userId: null });
    }
    if (Object.keys(queryObj).length > 0) {
        conditions.push(queryObj);
    }
    const whereClause = conditions.length > 0 ? { AND: conditions } : {};
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 1000;
    const skip = (page - 1) * limit;
    const [orders, total] = yield Promise.all([
        db_1.default.order.findMany({
            where: whereClause,
            include: {
                items: {
                    include: {
                        book: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                coupon: true,
            },
            orderBy: {
                createdAt: query.sortOrder || 'desc',
            },
            skip,
            take: limit,
        }),
        db_1.default.order.count({ where: whereClause }),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        data: orders,
    };
});
const getOrderByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield db_1.default.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    book: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            coupon: true,
        },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
    }
    return order;
});
const trackOrderByCodeFromDB = (orderCodeOrTxn) => __awaiter(void 0, void 0, void 0, function* () {
    const clean = orderCodeOrTxn.trim();
    const order = yield db_1.default.order.findFirst({
        where: {
            OR: [
                { orderCode: clean },
                { transactionId: clean },
                { trackingNumber: clean },
            ],
        },
        include: {
            items: {
                include: {
                    book: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            coupon: true,
        },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, `No order found with code "${clean}"`);
    }
    return order;
});
const getMyOrdersFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    book: true,
                },
            },
            coupon: true,
        },
        orderBy: { createdAt: 'desc' },
    });
});
const updateOrderStatusInDB = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield db_1.default.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
    }
    // If transitioning to CANCELLED and was not previously cancelled, restock books
    if (payload.orderStatus === client_1.OrderStatus.CANCELLED && order.orderStatus !== client_1.OrderStatus.CANCELLED) {
        return yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const item of order.items) {
                yield tx.book.update({
                    where: { id: item.bookId },
                    data: {
                        sellStock: {
                            increment: item.quantity,
                        },
                    },
                });
            }
            const updated = yield tx.order.update({
                where: { id: orderId },
                data: Object.assign({ orderStatus: client_1.OrderStatus.CANCELLED }, (payload.paymentStatus && { paymentStatus: payload.paymentStatus })),
                include: {
                    items: { include: { book: true } },
                    user: true,
                },
            });
            (0, socket_1.emitOrderStatusUpdate)(updated.orderCode, {
                orderStatus: updated.orderStatus,
                paymentStatus: updated.paymentStatus,
            });
            return updated;
        }));
    }
    const updated = yield db_1.default.order.update({
        where: { id: orderId },
        data: Object.assign(Object.assign({}, (payload.orderStatus && { orderStatus: payload.orderStatus })), (payload.paymentStatus && { paymentStatus: payload.paymentStatus })),
        include: {
            items: { include: { book: true } },
            user: true,
        },
    });
    (0, socket_1.emitOrderStatusUpdate)(updated.orderCode, {
        orderStatus: updated.orderStatus,
        paymentStatus: updated.paymentStatus,
    });
    return updated;
});
const verifyPaymentInDB = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield db_1.default.order.findUnique({ where: { id: orderId } });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
    }
    if (payload.isApproved) {
        const updated = yield db_1.default.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                paymentVerified: true,
                verifiedAt: new Date(),
                orderStatus: client_1.OrderStatus.PROCESSING,
            },
            include: { items: { include: { book: true } }, user: true },
        });
        if (updated.customerPhone) {
            (0, sms_1.sendSMS)(updated.customerPhone, sms_1.SMSTemplates.paymentApproved(updated.orderCode)).catch((e) => console.error('SMS notification error:', e));
        }
        (0, socket_1.emitOrderStatusUpdate)(updated.orderCode, {
            orderStatus: updated.orderStatus,
            paymentStatus: updated.paymentStatus,
            paymentVerified: true,
        });
        return updated;
    }
    else {
        const updated = yield db_1.default.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: client_1.PaymentStatus.FAILED,
                paymentVerified: false,
            },
            include: { items: { include: { book: true } }, user: true },
        });
        (0, socket_1.emitOrderStatusUpdate)(updated.orderCode, {
            orderStatus: updated.orderStatus,
            paymentStatus: updated.paymentStatus,
            paymentVerified: false,
        });
        return updated;
    }
});
const dispatchCourierInDB = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const order = yield db_1.default.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { book: true } } },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
    }
    // Generate 6-digit OTP code for customer delivery confirmation
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setDate(otpExpiresAt.getDate() + 7);
    const courierName = (payload === null || payload === void 0 ? void 0 : payload.courierName) || 'Steadfast Courier';
    // Book with Steadfast API
    const codAmount = order.paymentStatus === client_1.PaymentStatus.PAID ? 0 : order.totalAmount;
    const steadfastResult = yield (0, steadfast_1.createSteadfastOrder)({
        invoice: order.orderCode,
        recipient_name: order.customerName,
        recipient_phone: order.customerPhone,
        recipient_address: order.shippingAddress || 'Rajshahi University',
        cod_amount: codAmount,
        note: (payload === null || payload === void 0 ? void 0 : payload.note) || `RUIL Book Parcel: ${order.items.map((i) => i.book.title).join(', ')}`,
    });
    const trackingNumber = ((_a = steadfastResult.consignment) === null || _a === void 0 ? void 0 : _a.tracking_code) || `TRK-${Date.now().toString().slice(-6)}`;
    const updated = yield db_1.default.order.update({
        where: { id: orderId },
        data: {
            courierName,
            trackingNumber,
            orderStatus: client_1.OrderStatus.SHIPPED,
            shippedAt: new Date(),
            deliveryOtpHash: rawOtp,
            otpExpiresAt,
            otpVerified: false,
        },
        include: { items: { include: { book: true } }, user: true },
    });
    // SMS Customer with tracking number and OTP
    if (updated.customerPhone) {
        (0, sms_1.sendSMS)(updated.customerPhone, sms_1.SMSTemplates.courierShippedWithOTP(updated.orderCode, courierName, trackingNumber, rawOtp)).catch((e) => console.error('SMS notification error:', e));
    }
    (0, socket_1.emitOrderStatusUpdate)(updated.orderCode, {
        orderStatus: updated.orderStatus,
        courierName: updated.courierName,
        trackingNumber: updated.trackingNumber,
        shippedAt: updated.shippedAt,
    });
    return {
        order: updated,
        rawOtp,
        trackingNumber,
        courierName,
    };
});
/**
 * Public or authenticated OTP verification:
 * Can be called by delivery riders via public delivery confirmation page!
 */
const verifyDeliveryOtpInDB = (identifier, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const cleanOtp = otp.trim();
    const whereClause = {};
    if (identifier.orderId)
        whereClause.id = identifier.orderId;
    else if (identifier.trackingNumber)
        whereClause.trackingNumber = identifier.trackingNumber.trim();
    else
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'OrderId or trackingNumber is required!');
    const order = yield db_1.default.order.findFirst({
        where: whereClause,
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order parcel record not found!');
    }
    if (!order.deliveryOtpHash) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No delivery OTP was issued for this order!');
    }
    if (order.otpVerified) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Delivery OTP has already been verified for this parcel!');
    }
    if (order.otpExpiresAt && new Date() > new Date(order.otpExpiresAt)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Delivery OTP has expired!');
    }
    if (order.deliveryOtpHash !== cleanOtp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid 6-digit OTP code!');
    }
    const updated = yield db_1.default.order.update({
        where: { id: order.id },
        data: {
            otpVerified: true,
            orderStatus: client_1.OrderStatus.DELIVERED,
            paymentStatus: client_1.PaymentStatus.PAID,
            deliveredAt: new Date(),
        },
        include: { items: { include: { book: true } }, user: true },
    });
    if (updated.customerPhone) {
        (0, sms_1.sendSMS)(updated.customerPhone, sms_1.SMSTemplates.orderDelivered(updated.orderCode)).catch((e) => console.error('SMS notification error:', e));
    }
    (0, socket_1.emitOrderStatusUpdate)(updated.orderCode, {
        orderStatus: updated.orderStatus,
        paymentStatus: updated.paymentStatus,
        deliveredAt: updated.deliveredAt,
        otpVerified: true,
    });
    return updated;
});
const cancelOrderInDB = (orderId, userId, isStaff) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield db_1.default.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
    }
    if (!isStaff && userId && order.userId !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to cancel this order.');
    }
    if (order.orderStatus !== client_1.OrderStatus.PENDING) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot cancel order with status "${order.orderStatus}". Only PENDING orders can be cancelled.`);
    }
    return yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        for (const item of order.items) {
            yield tx.book.update({
                where: { id: item.bookId },
                data: {
                    sellStock: {
                        increment: item.quantity,
                    },
                },
            });
        }
        const cancelled = yield tx.order.update({
            where: { id: orderId },
            data: {
                orderStatus: client_1.OrderStatus.CANCELLED,
                paymentStatus: client_1.PaymentStatus.CANCELLED,
            },
            include: { items: { include: { book: true } }, user: true },
        });
        (0, socket_1.emitOrderStatusUpdate)(cancelled.orderCode, {
            orderStatus: client_1.OrderStatus.CANCELLED,
            paymentStatus: client_1.PaymentStatus.CANCELLED,
        });
        return cancelled;
    }));
});
const deleteOrderInDB = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield db_1.default.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Order not found!');
    }
    // If pending or processing, restore inventory
    if (order.orderStatus === client_1.OrderStatus.PENDING || order.orderStatus === client_1.OrderStatus.PROCESSING) {
        yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const item of order.items) {
                yield tx.book.update({
                    where: { id: item.bookId },
                    data: {
                        sellStock: {
                            increment: item.quantity,
                        },
                    },
                });
            }
            yield tx.order.delete({ where: { id: orderId } });
        }));
        return true;
    }
    yield db_1.default.order.delete({ where: { id: orderId } });
    return true;
});
exports.OrderService = {
    createOrderInDB,
    getAllOrdersFromDB,
    getOrderByIdFromDB,
    trackOrderByCodeFromDB,
    getMyOrdersFromDB,
    updateOrderStatusInDB,
    verifyPaymentInDB,
    dispatchCourierInDB,
    verifyDeliveryOtpInDB,
    cancelOrderInDB,
    deleteOrderInDB,
};

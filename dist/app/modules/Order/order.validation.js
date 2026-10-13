"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const orderItemValidationSchema = zod_1.z.object({
    bookId: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1').default(1),
});
const createOrderValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerName: zod_1.z.string().min(2, 'Customer name is required'),
        customerEmail: zod_1.z.string().email('Valid customer email is required'),
        customerPhone: zod_1.z.string().min(8, 'Valid phone number is required'),
        shippingAddress: zod_1.z.string().optional(),
        items: zod_1.z.array(orderItemValidationSchema).min(1, 'Order must contain at least one book item'),
        deliveryMethod: zod_1.z.nativeEnum(client_1.DeliveryMethod).optional().default(client_1.DeliveryMethod.COURIER),
        deliveryCharge: zod_1.z.number().min(0).optional().default(0),
        couponCode: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional().default(client_1.PaymentMethod.CASH),
        mfsProvider: zod_1.z.nativeEnum(client_1.MFSProvider).optional(),
        senderPhone: zod_1.z.string().optional(),
        customerTrxId: zod_1.z.string().optional(),
        isPOSSale: zod_1.z.boolean().optional(),
        posNotes: zod_1.z.string().optional(),
    }),
});
const updateOrderStatusValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderStatus: zod_1.z.nativeEnum(client_1.OrderStatus).optional(),
        paymentStatus: zod_1.z.nativeEnum(client_1.PaymentStatus).optional(),
    }),
});
const verifyOrderPaymentValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        isApproved: zod_1.z.boolean(),
        notes: zod_1.z.string().optional(),
    }),
});
const verifyDeliveryOtpValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        otp: zod_1.z.string().min(4, '6-digit OTP code is required'),
        orderId: zod_1.z.number().optional(),
        trackingNumber: zod_1.z.string().optional(),
    }),
});
exports.OrderValidation = {
    createOrderValidationSchema,
    updateOrderStatusValidationSchema,
    verifyOrderPaymentValidationSchema,
    verifyDeliveryOtpValidationSchema,
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const purchaseItemSchema = zod_1.z.object({
    bookId: zod_1.z.number().int('Book ID must be an integer').positive('Book ID must be positive'),
    quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive').default(1),
});
const guestPurchaseValidationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        guestName: zod_1.z.string().min(1, 'Guest name is required').optional(),
        customerName: zod_1.z.string().min(1, 'Customer name is required').optional(),
        guestEmail: zod_1.z.string().email('Valid guest email address is required').optional(),
        customerEmail: zod_1.z.string().email('Valid customer email address is required').optional(),
        guestPhone: zod_1.z.string().min(1, 'Guest phone is required').optional(),
        customerPhone: zod_1.z.string().min(1, 'Customer phone is required').optional(),
        address: zod_1.z.string().min(1, 'Address is required').optional(),
        shippingAddress: zod_1.z.string().min(1, 'Shipping address is required').optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        items: zod_1.z.array(purchaseItemSchema).min(1, 'At least one item is required').optional(),
        bookId: zod_1.z.number().int().positive().optional(),
        quantity: zod_1.z.number().int().positive().optional(),
    })
        .refine((data) => data.guestName || data.customerName, {
        message: 'Full Name is required',
        path: ['guestName'],
    })
        .refine((data) => data.guestEmail || data.customerEmail, {
        message: 'Valid Email Address is required for guest purchases',
        path: ['guestEmail'],
    })
        .refine((data) => data.guestPhone || data.customerPhone, {
        message: 'Phone number is required',
        path: ['guestPhone'],
    })
        .refine((data) => data.address || data.shippingAddress, {
        message: 'Shipping delivery address is required',
        path: ['shippingAddress'],
    })
        .refine((data) => (data.items && data.items.length > 0) || data.bookId, {
        message: 'Either items array or bookId is required',
        path: ['items'],
    }),
});
const memberPurchaseValidationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        shippingAddress: zod_1.z.string().min(1, 'Shipping address is required').optional(),
        address: zod_1.z.string().min(1, 'Address is required').optional(),
        customerPhone: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        items: zod_1.z.array(purchaseItemSchema).min(1, 'At least one item is required').optional(),
        bookId: zod_1.z.number().int().positive().optional(),
        quantity: zod_1.z.number().int().positive().optional(),
    })
        .refine((data) => data.shippingAddress || data.address, {
        message: 'Shipping address is required',
        path: ['shippingAddress'],
    })
        .refine((data) => (data.items && data.items.length > 0) || data.bookId, {
        message: 'Either items array or bookId is required',
        path: ['items'],
    }),
});
const guestOrdersLookupValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Valid email address is required to lookup guest orders'),
        phone: zod_1.z.string().optional(),
        transactionId: zod_1.z.string().optional(),
    }),
});
const guestCancelOrderValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        transactionId: zod_1.z.string().min(1, 'Transaction ID is required'),
        email: zod_1.z.string().email('Valid email address is required to authorize order cancellation'),
        reason: zod_1.z.string().max(300, 'Reason cannot exceed 300 characters').optional(),
    }),
});
const posSaleValidationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        buyerType: zod_1.z.enum(['MEMBER', 'GUEST']).default('MEMBER'),
        memberId: zod_1.z.number().int().positive().optional(),
        studentOrVoterId: zod_1.z.string().optional(),
        customerName: zod_1.z.string().optional(),
        customerPhone: zod_1.z.string().optional(),
        customerEmail: zod_1.z.union([zod_1.z.string().email('Invalid email address'), zod_1.z.literal('')]).optional(),
        shippingAddress: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional().default(client_1.PaymentMethod.CASH),
        items: zod_1.z.array(purchaseItemSchema).min(1, 'At least one item is required').optional(),
        bookId: zod_1.z.number().int().positive().optional(),
        quantity: zod_1.z.number().int().positive().optional(),
        notes: zod_1.z.string().optional(),
    })
        .refine((data) => (data.items && data.items.length > 0) || data.bookId, {
        message: 'Either items array or bookId is required',
        path: ['items'],
    }),
});
exports.PurchaseValidation = {
    guestPurchaseValidationSchema,
    memberPurchaseValidationSchema,
    guestOrdersLookupValidationSchema,
    guestCancelOrderValidationSchema,
    posSaleValidationSchema,
};

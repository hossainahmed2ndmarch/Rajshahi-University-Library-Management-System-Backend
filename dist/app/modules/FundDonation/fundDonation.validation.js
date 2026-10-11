"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundDonationValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const initiateDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive().nullable().optional(),
        amount: zod_1.z.number().positive('Donation amount must be greater than 0'),
        donorName: zod_1.z.string().optional(),
        donorEmail: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
        donorPhone: zod_1.z.string().optional(),
        isAnonymous: zod_1.z.boolean().optional().default(false),
        donorNote: zod_1.z.string().optional(),
    }),
});
const createManualDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive().nullable().optional(),
        userId: zod_1.z.number().int().positive().nullable().optional(),
        amount: zod_1.z.number().positive('Amount must be positive'),
        donorName: zod_1.z.string().optional(),
        donorEmail: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
        donorPhone: zod_1.z.string().optional(),
        isAnonymous: zod_1.z.boolean().optional().default(false),
        donorNote: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional().default(client_1.PaymentMethod.CASH),
        paymentStatus: zod_1.z.nativeEnum(client_1.PaymentStatus).optional().default(client_1.PaymentStatus.PAID),
        receiptNo: zod_1.z.string().optional(),
        paidAt: zod_1.z.string().optional(),
    }),
});
const updateDonationValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive().nullable().optional(),
        amount: zod_1.z.number().positive().optional(),
        donorName: zod_1.z.string().optional(),
        donorEmail: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
        donorPhone: zod_1.z.string().optional(),
        isAnonymous: zod_1.z.boolean().optional(),
        donorNote: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        paymentStatus: zod_1.z.nativeEnum(client_1.PaymentStatus).optional(),
        receiptNo: zod_1.z.string().optional(),
    }),
});
exports.FundDonationValidation = {
    initiateDonationValidationSchema,
    createManualDonationValidationSchema,
    updateDonationValidationSchema,
};

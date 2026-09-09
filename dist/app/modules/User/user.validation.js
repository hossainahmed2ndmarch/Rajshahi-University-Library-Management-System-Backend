"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const registerMemberValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().min(1, 'Email is required').email('Invalid email format'),
        phone: zod_1.z.string().min(1, 'Phone number is required').min(10, 'Phone number must be valid'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        name: zod_1.z.string().min(1, 'Name is required'),
        studentOrVoterId: zod_1.z.string().min(1, 'Student or Voter ID is required'),
        institution: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        session: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional().default(client_1.PaymentMethod.CASH),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        isPaid: zod_1.z.boolean().optional(),
        membershipStartedAt: zod_1.z.string().optional(),
        membershipExpiresAt: zod_1.z.string().optional(),
    }),
});
const updateUserValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        avatarUrl: zod_1.z.string().optional(),
        studentOrVoterId: zod_1.z.string().optional(),
        institution: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        session: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        isPaid: zod_1.z.boolean().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        membershipStartedAt: zod_1.z.string().optional(),
        membershipExpiresAt: zod_1.z.string().optional(),
    }),
});
const updateMyProfileValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name cannot be empty').optional(),
        avatarUrl: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        session: zod_1.z.string().optional(),
        institution: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
    }),
});
const renewMembershipValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional().default(client_1.PaymentMethod.CASH),
        amount: zod_1.z.number().optional().default(100),
    }),
});
exports.UserValidation = {
    registerMemberValidationSchema,
    updateUserValidationSchema,
    updateMyProfileValidationSchema,
    renewMembershipValidationSchema,
};

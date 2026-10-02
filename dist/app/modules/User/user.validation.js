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
        institution: zod_1.z.string().nullable().optional(),
        department: zod_1.z.string().nullable().optional(),
        session: zod_1.z.string().nullable().optional(),
        faculty: zod_1.z.string().nullable().optional(),
        whatsappNumber: zod_1.z.string().nullable().optional(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).nullable().optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType).nullable().optional(),
        accommodationName: zod_1.z.string().nullable().optional(),
        permanentAddress: zod_1.z.string().nullable().optional(),
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
        email: zod_1.z.string().email('Invalid email format').optional(),
        avatarUrl: zod_1.z.string().nullable().optional(),
        studentOrVoterId: zod_1.z.string().optional(),
        institution: zod_1.z.string().nullable().optional(),
        department: zod_1.z.string().nullable().optional(),
        session: zod_1.z.string().nullable().optional(),
        faculty: zod_1.z.string().nullable().optional(),
        whatsappNumber: zod_1.z.string().nullable().optional(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).nullable().optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType).nullable().optional(),
        accommodationName: zod_1.z.string().nullable().optional(),
        permanentAddress: zod_1.z.string().nullable().optional(),
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
        isRudcMember: zod_1.z.boolean().optional(),
        rudcMemberType: zod_1.z.nativeEnum(client_1.RudcMemberType).nullable().optional(),
        rudcStatus: zod_1.z.nativeEnum(client_1.RudcApplicationStatus).nullable().optional(),
        supervisorId: zod_1.z.number().int().nullable().optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        isPaid: zod_1.z.boolean().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        membershipStartedAt: zod_1.z.string().nullable().optional(),
        membershipExpiresAt: zod_1.z.string().nullable().optional(),
    }),
});
const updateMyProfileValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name cannot be empty').optional(),
        avatarUrl: zod_1.z.string().nullable().optional(),
        department: zod_1.z.string().nullable().optional(),
        session: zod_1.z.string().nullable().optional(),
        institution: zod_1.z.string().nullable().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email format').optional(),
        studentOrVoterId: zod_1.z.string().optional(),
        faculty: zod_1.z.string().nullable().optional(),
        whatsappNumber: zod_1.z.string().nullable().optional(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).nullable().optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType).nullable().optional(),
        accommodationName: zod_1.z.string().nullable().optional(),
        permanentAddress: zod_1.z.string().nullable().optional(),
    }),
});
const renewMembershipValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional().default(client_1.PaymentMethod.CASH),
        amount: zod_1.z.number().optional(),
        months: zod_1.z.number().optional(),
    }),
});
const convertMembershipValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userIds: zod_1.z.array(zod_1.z.number().int().positive()).min(1, 'At least one user must be selected'),
        targetRoleOrOrg: zod_1.z.enum(['MAKE_RUDC_MEMBER', 'MAKE_RUDC_VOLUNTEER', 'MAKE_RUIL_MEMBER']),
        confirmPayment: zod_1.z.boolean().optional(),
        paymentMethod: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        months: zod_1.z.number().optional(),
    }),
});
exports.UserValidation = {
    registerMemberValidationSchema,
    updateUserValidationSchema,
    updateMyProfileValidationSchema,
    renewMembershipValidationSchema,
    convertMembershipValidationSchema,
};

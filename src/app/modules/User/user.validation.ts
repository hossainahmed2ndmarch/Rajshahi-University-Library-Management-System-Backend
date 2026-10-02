import { z } from 'zod';
import {
  AccommodationType,
  BloodGroup,
  Organization,
  PaymentMethod,
  RudcApplicationStatus,
  RudcMemberType,
  UserRole,
  UserStatus,
} from '@prisma/client';

const registerMemberValidationSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    phone: z.string().min(1, 'Phone number is required').min(10, 'Phone number must be valid'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    studentOrVoterId: z.string().min(1, 'Student or Voter ID is required'),
    institution: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    session: z.string().nullable().optional(),
    faculty: z.string().nullable().optional(),
    whatsappNumber: z.string().nullable().optional(),
    bloodGroup: z.nativeEnum(BloodGroup).nullable().optional(),
    skills: z.array(z.string()).optional(),
    accommodationType: z.nativeEnum(AccommodationType).nullable().optional(),
    accommodationName: z.string().nullable().optional(),
    permanentAddress: z.string().nullable().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    status: z.nativeEnum(UserStatus).optional(),
    isPaid: z.boolean().optional(),
    membershipStartedAt: z.string().optional(),
    membershipExpiresAt: z.string().optional(),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    avatarUrl: z.string().nullable().optional(),
    studentOrVoterId: z.string().optional(),
    institution: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    session: z.string().nullable().optional(),
    faculty: z.string().nullable().optional(),
    whatsappNumber: z.string().nullable().optional(),
    bloodGroup: z.nativeEnum(BloodGroup).nullable().optional(),
    skills: z.array(z.string()).optional(),
    accommodationType: z.nativeEnum(AccommodationType).nullable().optional(),
    accommodationName: z.string().nullable().optional(),
    permanentAddress: z.string().nullable().optional(),
    org: z.nativeEnum(Organization).optional(),
    isRudcMember: z.boolean().optional(),
    rudcMemberType: z.nativeEnum(RudcMemberType).nullable().optional(),
    rudcStatus: z.nativeEnum(RudcApplicationStatus).nullable().optional(),
    supervisorId: z.number().int().nullable().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isPaid: z.boolean().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    membershipStartedAt: z.string().nullable().optional(),
    membershipExpiresAt: z.string().nullable().optional(),
  }),
});

const updateMyProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    avatarUrl: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    session: z.string().nullable().optional(),
    institution: z.string().nullable().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
    studentOrVoterId: z.string().optional(),
    faculty: z.string().nullable().optional(),
    whatsappNumber: z.string().nullable().optional(),
    bloodGroup: z.nativeEnum(BloodGroup).nullable().optional(),
    skills: z.array(z.string()).optional(),
    accommodationType: z.nativeEnum(AccommodationType).nullable().optional(),
    accommodationName: z.string().nullable().optional(),
    permanentAddress: z.string().nullable().optional(),
  }),
});

const renewMembershipValidationSchema = z.object({
  body: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    amount: z.number().optional(),
    months: z.number().optional(),
  }),
});

const convertMembershipValidationSchema = z.object({
  body: z.object({
    userIds: z.array(z.number().int().positive()).min(1, 'At least one user must be selected'),
    targetRoleOrOrg: z.enum(['MAKE_RUDC_MEMBER', 'MAKE_RUDC_VOLUNTEER', 'MAKE_RUIL_MEMBER']),
    confirmPayment: z.boolean().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    months: z.number().optional(),
  }),
});

export const UserValidation = {
  registerMemberValidationSchema,
  updateUserValidationSchema,
  updateMyProfileValidationSchema,
  renewMembershipValidationSchema,
  convertMembershipValidationSchema,
};

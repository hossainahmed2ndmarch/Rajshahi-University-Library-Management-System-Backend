import { z } from 'zod';
import { PaymentMethod, UserRole, UserStatus } from '@prisma/client';

const registerMemberValidationSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    phone: z.string().min(1, 'Phone number is required').min(10, 'Phone number must be valid'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    studentOrVoterId: z.string().min(1, 'Student or Voter ID is required'),
    institution: z.string().optional(),
    department: z.string().optional(),
    session: z.string().optional(),
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
    avatarUrl: z.string().optional(),
    studentOrVoterId: z.string().optional(),
    institution: z.string().optional(),
    department: z.string().optional(),
    session: z.string().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isPaid: z.boolean().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    membershipStartedAt: z.string().optional(),
    membershipExpiresAt: z.string().optional(),
  }),
});

const updateMyProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    avatarUrl: z.string().optional(),
    department: z.string().optional(),
    session: z.string().optional(),
    institution: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const renewMembershipValidationSchema = z.object({
  body: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    amount: z.number().optional().default(100),
  }),
});

export const UserValidation = {
  registerMemberValidationSchema,
  updateUserValidationSchema,
  updateMyProfileValidationSchema,
  renewMembershipValidationSchema,
};

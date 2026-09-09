import { PaymentMethod, UserRole, UserStatus } from '@prisma/client';

export type TRegisterMember = {
  email: string;
  phone: string;
  password: string;
  name: string;
  studentOrVoterId: string;
  institution?: string;
  department?: string;
  session?: string;
  paymentMethod?: PaymentMethod;
  membershipStartedAt?: Date | string;
  membershipExpiresAt?: Date | string;
  isPaid?: boolean;
  status?: UserStatus;
};

export type TUpdateUser = {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  studentOrVoterId?: string;
  institution?: string;
  department?: string;
  session?: string;
  status?: UserStatus;
  role?: UserRole;
  isPaid?: boolean;
  paymentMethod?: PaymentMethod;
  membershipStartedAt?: Date | string;
  membershipExpiresAt?: Date | string;
};

export type TUserFilterRequest = {
  searchTerm?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  session?: string;
};

export type TUpdateMyProfile = {
  name?: string;
  avatarUrl?: string;
  department?: string;
  session?: string;
  institution?: string;
  phone?: string;
};

export type TRenewMembership = {
  paymentMethod?: PaymentMethod;
  amount?: number;
};

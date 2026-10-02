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

export type TRegisterMember = {
  email: string;
  phone: string;
  password: string;
  name: string;
  studentOrVoterId: string;
  institution?: string | null;
  department?: string | null;
  session?: string | null;
  faculty?: string | null;
  whatsappNumber?: string | null;
  bloodGroup?: BloodGroup | null;
  skills?: string[];
  accommodationType?: AccommodationType | null;
  accommodationName?: string | null;
  permanentAddress?: string | null;
  paymentMethod?: PaymentMethod;
  membershipStartedAt?: Date | string;
  membershipExpiresAt?: Date | string;
  isPaid?: boolean;
  status?: UserStatus;
};

export type TUpdateUser = {
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  studentOrVoterId?: string;
  institution?: string;
  department?: string;
  session?: string;
  faculty?: string | null;
  whatsappNumber?: string | null;
  bloodGroup?: BloodGroup | null;
  skills?: string[];
  accommodationType?: AccommodationType | null;
  accommodationName?: string | null;
  permanentAddress?: string | null;
  org?: Organization;
  isRudcMember?: boolean;
  rudcMemberType?: RudcMemberType | null;
  rudcStatus?: RudcApplicationStatus | null;
  supervisorId?: number | null;
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
  org?: Organization | string;
};

export type TUpdateMyProfile = {
  name?: string;
  avatarUrl?: string;
  department?: string;
  session?: string;
  institution?: string;
  phone?: string;
  email?: string;
  studentOrVoterId?: string;
  faculty?: string | null;
  whatsappNumber?: string | null;
  bloodGroup?: BloodGroup | null;
  skills?: string[];
  accommodationType?: AccommodationType | null;
  accommodationName?: string | null;
  permanentAddress?: string | null;
};

export type TRenewMembership = {
  paymentMethod?: PaymentMethod;
  amount?: number;
  months?: number;
};

export type TConvertMembership = {
  userIds: number[];
  targetRoleOrOrg: 'MAKE_RUDC_MEMBER' | 'MAKE_RUDC_VOLUNTEER' | 'MAKE_RUIL_MEMBER';
  confirmPayment?: boolean;
  paymentMethod?: PaymentMethod;
  months?: number;
};

import {
  AccommodationType,
  BloodGroup,
  Gender,
  Organization,
  PaymentMethod,
  RudcApplicationStatus,
  RudcMemberType,
  UserRole,
  UserStatus,
} from '@prisma/client';

export type TRegisterMember = {
  email?: string;
  phone?: string;
  password?: string;
  name: string;
  gender?: Gender | null;
  dateOfBirth?: Date | string | null;
  studentOrVoterId?: string;
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
  paymentTrxId?: string | null;
  membershipStartedAt?: Date | string;
  membershipExpiresAt?: Date | string;
  isPaid?: boolean;
  status?: UserStatus;
  role?: UserRole;
  org?: Organization;
  rudcMemberType?: RudcMemberType;
  rudcStatus?: RudcApplicationStatus;
};

export type TUpdateUser = {
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  gender?: Gender | null;
  dateOfBirth?: Date | string | null;
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
  supervisorId?: string | null;
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
  gender?: Gender | null;
  dateOfBirth?: Date | string | null;
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
  userIds: string[];
  targetRoleOrOrg: 'MAKE_RUDC_MEMBER' | 'MAKE_RUDC_VOLUNTEER' | 'MAKE_RUIL_MEMBER' | 'MAKE_GENERAL_USER';
  confirmPayment?: boolean;
  paymentMethod?: PaymentMethod;
  months?: number;
  faculty?: string;
  department?: string;
  session?: string;
  studentOrVoterId?: string;
};

export type TBulkUpdateUsers = {
  userIds: string[];
  status?: UserStatus;
  role?: UserRole;
  org?: Organization;
};

export type TBulkDeleteUsers = {
  userIds: string[];
};

export type TCustomNotice = {
  userIds?: string[];
  recipients?: string[];
  subject: string;
  htmlContent: string;
  noticeType?: 'INTERVIEW' | 'OVERDUE' | 'GENERAL';
};

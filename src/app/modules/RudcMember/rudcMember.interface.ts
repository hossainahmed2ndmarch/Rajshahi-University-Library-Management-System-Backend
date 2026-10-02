import {
  AccommodationType,
  BloodGroup,
  Organization,
  RudcApplicationStatus,
  RudcMemberType,
} from '@prisma/client';

export type TRudcApplyPayload = {
  name: string;
  email: string;
  phone: string;
  password?: string;
  department: string;
  faculty: string;
  studentOrVoterId: string;
  whatsappNumber: string;
  bloodGroup: BloodGroup;
  skills: string[];
  accommodationType: AccommodationType;
  accommodationName: string;
  permanentAddress: string;
  isAffiliatedWithOther?: boolean;
  otherOrgName?: string | null;
  rudcTermsAccepted: boolean;
};

export type TUpdateRudcMemberPayload = {
  rudcMemberType?: RudcMemberType;
  rudcStatus?: RudcApplicationStatus;
  supervisorId?: number | null;
  department?: string;
  faculty?: string;
  whatsappNumber?: string;
  bloodGroup?: BloodGroup;
  skills?: string[];
  accommodationType?: AccommodationType;
  accommodationName?: string;
  permanentAddress?: string;
  isAffiliatedWithOther?: boolean;
  otherOrgName?: string | null;
  interviewDate?: string | null;
  interviewNotes?: string | null;
};

export type TSendInterviewEmailPayload = {
  userIds: number[];
  interviewDate: string;
  interviewTime?: string;
  venueOrLink: string;
  instructions?: string;
  subject?: string;
};

export type TCreatePreExistedRudcMemberPayload = {
  name: string;
  email: string;
  phone: string;
  password?: string;
  studentOrVoterId: string;
  department?: string;
  faculty?: string;
  session?: string;
  institution?: string;
  whatsappNumber?: string;
  bloodGroup?: BloodGroup;
  skills?: string[];
  accommodationType?: AccommodationType;
  accommodationName?: string;
  permanentAddress?: string;
  isAffiliatedWithOther?: boolean;
  otherOrgName?: string | null;
  rudcMemberType?: RudcMemberType;
  rudcStatus?: RudcApplicationStatus;
  supervisorId?: number | null;
  rudcJoinedAt?: string;
  teamIds?: number[];
  org?: Organization;
};

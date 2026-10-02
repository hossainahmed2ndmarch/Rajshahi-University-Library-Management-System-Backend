import { z } from 'zod';
import {
  AccommodationType,
  BloodGroup,
  Organization,
  RudcApplicationStatus,
  RudcMemberType,
} from '@prisma/client';

const applyRudcZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Valid email is required'),
    phone: z.string().min(11, 'Phone number must be at least 11 digits'),
    password: z.string().min(6).optional(),
    department: z.string().min(1, 'Department is required'),
    faculty: z.string().min(1, 'Faculty is required'),
    studentOrVoterId: z.string().min(1, 'NID/Student ID/HSC Reg is required'),
    whatsappNumber: z.string().min(11, 'WhatsApp number is required'),
    bloodGroup: z.nativeEnum(BloodGroup),
    skills: z.array(z.string()).min(1, 'Please provide at least one skill'),
    accommodationType: z.nativeEnum(AccommodationType),
    accommodationName: z.string().min(1, 'Hall/Mess/Home name is required'),
    permanentAddress: z.string().min(1, 'Permanent address is required'),
    isAffiliatedWithOther: z.boolean().default(false),
    otherOrgName: z.string().optional().nullable(),
    rudcTermsAccepted: z.literal(true),
  }),
});

const updateRudcMemberZodSchema = z.object({
  body: z.object({
    rudcMemberType: z.nativeEnum(RudcMemberType).optional(),
    rudcStatus: z.nativeEnum(RudcApplicationStatus).optional(),
    supervisorId: z.number().nullable().optional(),
    department: z.string().optional(),
    faculty: z.string().optional(),
    whatsappNumber: z.string().optional(),
    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    skills: z.array(z.string()).optional(),
    accommodationType: z.nativeEnum(AccommodationType).optional(),
    accommodationName: z.string().optional(),
    permanentAddress: z.string().optional(),
    isAffiliatedWithOther: z.boolean().optional(),
    otherOrgName: z.string().nullable().optional(),
    interviewDate: z.string().nullable().optional(),
    interviewNotes: z.string().nullable().optional(),
  }),
});

const sendInterviewEmailZodSchema = z.object({
  body: z.object({
    userIds: z.array(z.number()).min(1, 'At least one applicant must be selected'),
    interviewDate: z.string().min(1, 'Interview date is required'),
    interviewTime: z.string().optional(),
    venueOrLink: z.string().min(1, 'Interview venue or meeting link is required'),
    instructions: z.string().optional(),
    subject: z.string().optional(),
  }),
});

const createPreExistedRudcMemberZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Valid email is required'),
    phone: z.string().min(11, 'Phone number must be at least 11 digits'),
    password: z.string().min(6).optional(),
    studentOrVoterId: z.string().min(1, 'Student/Voter ID is required'),
    department: z.string().optional(),
    faculty: z.string().optional(),
    session: z.string().optional(),
    institution: z.string().optional(),
    whatsappNumber: z.string().optional(),
    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    skills: z.array(z.string()).optional(),
    accommodationType: z.nativeEnum(AccommodationType).optional(),
    accommodationName: z.string().optional(),
    permanentAddress: z.string().optional(),
    isAffiliatedWithOther: z.boolean().optional(),
    otherOrgName: z.string().nullable().optional(),
    rudcMemberType: z.nativeEnum(RudcMemberType).default(RudcMemberType.VOLUNTEER),
    rudcStatus: z.nativeEnum(RudcApplicationStatus).default(RudcApplicationStatus.APPROVED),
    supervisorId: z.number().nullable().optional(),
    rudcJoinedAt: z.string().optional(),
    teamIds: z.array(z.number()).optional(),
    org: z.nativeEnum(Organization).optional(),
  }),
});

export const RudcMemberValidation = {
  applyRudcZodSchema,
  updateRudcMemberZodSchema,
  sendInterviewEmailZodSchema,
  createPreExistedRudcMemberZodSchema,
};

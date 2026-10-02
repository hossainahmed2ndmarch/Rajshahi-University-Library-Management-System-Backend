"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcMemberValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const applyRudcZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Full name is required'),
        email: zod_1.z.string().min(1, 'Email is required').email('Valid email is required'),
        phone: zod_1.z.string().min(11, 'Phone number must be at least 11 digits'),
        password: zod_1.z.string().min(6).optional(),
        department: zod_1.z.string().min(1, 'Department is required'),
        faculty: zod_1.z.string().min(1, 'Faculty is required'),
        studentOrVoterId: zod_1.z.string().min(1, 'NID/Student ID/HSC Reg is required'),
        whatsappNumber: zod_1.z.string().min(11, 'WhatsApp number is required'),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup),
        skills: zod_1.z.array(zod_1.z.string()).min(1, 'Please provide at least one skill'),
        accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType),
        accommodationName: zod_1.z.string().min(1, 'Hall/Mess/Home name is required'),
        permanentAddress: zod_1.z.string().min(1, 'Permanent address is required'),
        isAffiliatedWithOther: zod_1.z.boolean().default(false),
        otherOrgName: zod_1.z.string().optional().nullable(),
        rudcTermsAccepted: zod_1.z.literal(true),
    }),
});
const updateRudcMemberZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        rudcMemberType: zod_1.z.nativeEnum(client_1.RudcMemberType).optional(),
        rudcStatus: zod_1.z.nativeEnum(client_1.RudcApplicationStatus).optional(),
        supervisorId: zod_1.z.number().nullable().optional(),
        department: zod_1.z.string().optional(),
        faculty: zod_1.z.string().optional(),
        whatsappNumber: zod_1.z.string().optional(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType).optional(),
        accommodationName: zod_1.z.string().optional(),
        permanentAddress: zod_1.z.string().optional(),
        isAffiliatedWithOther: zod_1.z.boolean().optional(),
        otherOrgName: zod_1.z.string().nullable().optional(),
        interviewDate: zod_1.z.string().nullable().optional(),
        interviewNotes: zod_1.z.string().nullable().optional(),
    }),
});
const sendInterviewEmailZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userIds: zod_1.z.array(zod_1.z.number()).min(1, 'At least one applicant must be selected'),
        interviewDate: zod_1.z.string().min(1, 'Interview date is required'),
        interviewTime: zod_1.z.string().optional(),
        venueOrLink: zod_1.z.string().min(1, 'Interview venue or meeting link is required'),
        instructions: zod_1.z.string().optional(),
        subject: zod_1.z.string().optional(),
    }),
});
const createPreExistedRudcMemberZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Full name is required'),
        email: zod_1.z.string().min(1, 'Email is required').email('Valid email is required'),
        phone: zod_1.z.string().min(11, 'Phone number must be at least 11 digits'),
        password: zod_1.z.string().min(6).optional(),
        studentOrVoterId: zod_1.z.string().min(1, 'Student/Voter ID is required'),
        department: zod_1.z.string().optional(),
        faculty: zod_1.z.string().optional(),
        session: zod_1.z.string().optional(),
        institution: zod_1.z.string().optional(),
        whatsappNumber: zod_1.z.string().optional(),
        bloodGroup: zod_1.z.nativeEnum(client_1.BloodGroup).optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        accommodationType: zod_1.z.nativeEnum(client_1.AccommodationType).optional(),
        accommodationName: zod_1.z.string().optional(),
        permanentAddress: zod_1.z.string().optional(),
        isAffiliatedWithOther: zod_1.z.boolean().optional(),
        otherOrgName: zod_1.z.string().nullable().optional(),
        rudcMemberType: zod_1.z.nativeEnum(client_1.RudcMemberType).default(client_1.RudcMemberType.VOLUNTEER),
        rudcStatus: zod_1.z.nativeEnum(client_1.RudcApplicationStatus).default(client_1.RudcApplicationStatus.APPROVED),
        supervisorId: zod_1.z.number().nullable().optional(),
        rudcJoinedAt: zod_1.z.string().optional(),
        teamIds: zod_1.z.array(zod_1.z.number()).optional(),
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
    }),
});
exports.RudcMemberValidation = {
    applyRudcZodSchema,
    updateRudcMemberZodSchema,
    sendInterviewEmailZodSchema,
    createPreExistedRudcMemberZodSchema,
};

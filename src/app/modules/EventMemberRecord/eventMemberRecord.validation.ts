import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

const bulkAttendanceValidationSchema = z.object({
  body: z.object({
    records: z.array(
      z.object({
        eventId: z.number().int().positive('eventId is required'),
        userId: z.number().int().positive('userId is required'),
        sessionId: z.number().int().positive().nullable().optional(),
        sessionDate: z.string().nullable().optional(),
        status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
      }),
    ).min(1, 'At least one attendance record is required'),
  }),
});

const submitFeedbackValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive('eventId is required'),
    sessionId: z.number().int().positive().nullable().optional(),
    sessionDate: z.string().nullable().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(1, 'Feedback comment cannot be empty'),
  }),
});

const selfAttendanceValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive('eventId is required'),
    sessionId: z.number().int().positive().nullable().optional(),
    sessionDate: z.string().nullable().optional(),
    status: z.nativeEnum(AttendanceStatus).optional().default(AttendanceStatus.INTERESTED),
  }),
});

const approveFeedbackValidationSchema = z.object({
  body: z.object({
    isApproved: z.boolean(),
  }),
});

const campaignSubmissionValidationSchema = z.object({
  body: z.object({
    eventId: z.number().int().positive('eventId is required'),
    sessionId: z.number().int().positive().nullable().optional(),
    sessionDate: z.string().nullable().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    submissionData: z.record(z.string(), z.any()),
  }),
});

const publishRecordAsArticleValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    authorDesignation: z.string().optional(),
    category: z.string().optional(),
    coverImage: z.string().url().nullable().optional(),
  }),
});

export const EventMemberRecordValidation = {
  bulkAttendanceValidationSchema,
  submitFeedbackValidationSchema,
  selfAttendanceValidationSchema,
  approveFeedbackValidationSchema,
  campaignSubmissionValidationSchema,
  publishRecordAsArticleValidationSchema,
};

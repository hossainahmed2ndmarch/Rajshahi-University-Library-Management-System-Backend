"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMemberRecordValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const bulkAttendanceValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        records: zod_1.z.array(zod_1.z.object({
            eventId: zod_1.z.number().int().positive('eventId is required'),
            userId: zod_1.z.number().int().positive('userId is required'),
            sessionId: zod_1.z.number().int().positive().nullable().optional(),
            sessionDate: zod_1.z.string().nullable().optional(),
            status: zod_1.z.nativeEnum(client_1.AttendanceStatus).default(client_1.AttendanceStatus.PRESENT),
        })).min(1, 'At least one attendance record is required'),
    }),
});
const submitFeedbackValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive('eventId is required'),
        sessionId: zod_1.z.number().int().positive().nullable().optional(),
        sessionDate: zod_1.z.string().nullable().optional(),
        rating: zod_1.z.number().int().min(1).max(5).optional(),
        comment: zod_1.z.string().min(1, 'Feedback comment cannot be empty'),
    }),
});
const selfAttendanceValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive('eventId is required'),
        sessionId: zod_1.z.number().int().positive().nullable().optional(),
        sessionDate: zod_1.z.string().nullable().optional(),
        status: zod_1.z.nativeEnum(client_1.AttendanceStatus).optional().default(client_1.AttendanceStatus.INTERESTED),
    }),
});
const approveFeedbackValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        isApproved: zod_1.z.boolean(),
    }),
});
exports.EventMemberRecordValidation = {
    bulkAttendanceValidationSchema,
    submitFeedbackValidationSchema,
    selfAttendanceValidationSchema,
    approveFeedbackValidationSchema,
};

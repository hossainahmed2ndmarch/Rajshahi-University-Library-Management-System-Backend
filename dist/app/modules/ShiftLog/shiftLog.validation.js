"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftLogValidation = void 0;
const zod_1 = require("zod");
const checkInValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        openingCash: zod_1.z
            .number()
            .min(0, 'Opening cash float cannot be negative'),
        notes: zod_1.z.string().optional(),
    }),
});
const checkOutValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        closingCash: zod_1.z
            .number()
            .min(0, 'Closing cash cannot be negative'),
        cashCollected: zod_1.z.number().min(0, 'Cash collected cannot be negative').optional(),
        tasksCompleted: zod_1.z.string().optional(),
        handoverNotes: zod_1.z.string().optional(),
    }),
});
const scheduleShiftValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        startTime: zod_1.z.string().min(1, 'Shift start time is required'),
        endTime: zod_1.z.string().optional(),
        shiftSlotName: zod_1.z.string().optional(),
        openingCash: zod_1.z.number().min(0).optional().default(500),
        notes: zod_1.z.string().optional(),
        notifyRecipients: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))]).optional(),
        notificationMethod: zod_1.z.enum(['EMAIL', 'SMS', 'SOCIAL_MEDIA', 'ALL']).optional().default('EMAIL'),
    }),
});
const cancelShiftValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z
            .string()
            .min(3, 'Please provide a descriptive reason for cancelling shift'),
        notifyRecipients: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))]).optional(),
        notificationMethod: zod_1.z.enum(['EMAIL', 'SMS', 'SOCIAL_MEDIA', 'ALL']).optional().default('EMAIL'),
    }),
});
exports.ShiftLogValidation = {
    checkInValidationSchema,
    checkOutValidationSchema,
    scheduleShiftValidationSchema,
    cancelShiftValidationSchema,
};

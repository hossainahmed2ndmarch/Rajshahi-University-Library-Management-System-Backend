"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShifterScheduleValidation = void 0;
const zod_1 = require("zod");
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const createScheduleSchema = zod_1.z.object({
    body: zod_1.z.object({
        shifterId: zod_1.z.number(),
        dayOfWeek: zod_1.z
            .number()
            .min(0, 'Day of week must be 0-6')
            .max(6, 'Day of week must be 0-6'),
        dayName: zod_1.z.string().min(1, 'Bengali day name is required'),
        dayEn: zod_1.z.string().min(1, 'English day name is required'),
        slot: zod_1.z.string().min(1, 'Slot identifier is required'),
        slotName: zod_1.z.string().min(1, 'Slot display name is required'),
        startTime: zod_1.z
            .string()
            .regex(timeRegex, 'Start time must be in HH:MM format (e.g. 15:30)'),
        endTime: zod_1.z
            .string()
            .regex(timeRegex, 'End time must be in HH:MM format (e.g. 18:15)'),
        isActive: zod_1.z.boolean().optional().default(true),
        notes: zod_1.z.string().optional(),
    }),
});
const updateScheduleSchema = zod_1.z.object({
    body: zod_1.z.object({
        shifterId: zod_1.z.number().optional(),
        dayOfWeek: zod_1.z.number().min(0).max(6).optional(),
        dayName: zod_1.z.string().optional(),
        dayEn: zod_1.z.string().optional(),
        slot: zod_1.z.string().optional(),
        slotName: zod_1.z.string().optional(),
        startTime: zod_1.z.string().regex(timeRegex, 'Start time must be in HH:MM format').optional(),
        endTime: zod_1.z.string().regex(timeRegex, 'End time must be in HH:MM format').optional(),
        isActive: zod_1.z.boolean().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
exports.ShifterScheduleValidation = {
    createScheduleSchema,
    updateScheduleSchema,
};

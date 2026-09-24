"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSessionValidation = void 0;
const zod_1 = require("zod");
const createEventSessionValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive('Valid eventId is required'),
        sessionDate: zod_1.z.string().min(1, 'Session date is required'),
        chapter: zod_1.z.string().optional(),
        summary: zod_1.z.string().optional(),
        audioUrl: zod_1.z.string().url().nullable().optional(),
    }),
});
const updateEventSessionValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.number().int().positive().optional(),
        sessionDate: zod_1.z.string().optional(),
        chapter: zod_1.z.string().optional(),
        summary: zod_1.z.string().optional(),
        audioUrl: zod_1.z.string().url().nullable().optional(),
    }),
});
exports.EventSessionValidation = {
    createEventSessionValidationSchema,
    updateEventSessionValidationSchema,
};

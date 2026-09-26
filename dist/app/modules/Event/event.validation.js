"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createEventValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional().default(client_1.Organization.RUIL),
        activityId: zod_1.z.number().int().positive().nullable().optional(),
        title: zod_1.z.string().min(1, 'Title is required'),
        category: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(client_1.EventStatus).optional().default(client_1.EventStatus.UPCOMING),
        scheduleText: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        bannerImage: zod_1.z.string().url().nullable().optional(),
        startDate: zod_1.z.string().nullable().optional(),
        endDate: zod_1.z.string().nullable().optional(),
        currentChapter: zod_1.z.string().optional(),
        bookIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        isActive: zod_1.z.boolean().optional().default(true),
    }),
});
const updateEventValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
        activityId: zod_1.z.number().int().positive().nullable().optional(),
        title: zod_1.z.string().min(1).optional(),
        category: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(client_1.EventStatus).optional(),
        scheduleText: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        bannerImage: zod_1.z.string().url().nullable().optional(),
        startDate: zod_1.z.string().nullable().optional(),
        endDate: zod_1.z.string().nullable().optional(),
        currentChapter: zod_1.z.string().optional(),
        bookIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.EventValidation = {
    createEventValidationSchema,
    updateEventValidationSchema,
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createActivityValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional().default(client_1.Organization.RUIL),
        title: zod_1.z.string().min(1, 'Title is required'),
        category: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        bannerImage: zod_1.z.string().url().nullable().optional(),
        status: zod_1.z.nativeEnum(client_1.ActivityStatus).optional().default(client_1.ActivityStatus.ONGOING),
    }),
});
const updateActivityValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
        title: zod_1.z.string().min(1).optional(),
        category: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        bannerImage: zod_1.z.string().url().nullable().optional(),
        status: zod_1.z.nativeEnum(client_1.ActivityStatus).optional(),
    }),
});
exports.ActivityValidation = {
    createActivityValidationSchema,
    updateActivityValidationSchema,
};

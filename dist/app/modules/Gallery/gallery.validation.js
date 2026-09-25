"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createGalleryItemValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional().default(client_1.Organization.RUIL),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        mediaType: zod_1.z.nativeEnum(client_1.MediaType).optional().default(client_1.MediaType.IMAGE),
        url: zod_1.z.string().min(1, 'Media URL is required'),
        thumbnail: zod_1.z.string().optional().nullable(),
        assetKey: zod_1.z.string().optional().nullable(),
        category: zod_1.z.string().optional().nullable(),
        activityId: zod_1.z.number().int().positive().optional().nullable(),
        isPublished: zod_1.z.boolean().optional().default(true),
        featured: zod_1.z.boolean().optional().default(false),
    }),
});
const updateGalleryItemValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        org: zod_1.z.nativeEnum(client_1.Organization).optional(),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional().nullable(),
        mediaType: zod_1.z.nativeEnum(client_1.MediaType).optional(),
        url: zod_1.z.string().min(1).optional(),
        thumbnail: zod_1.z.string().optional().nullable(),
        assetKey: zod_1.z.string().optional().nullable(),
        category: zod_1.z.string().optional().nullable(),
        activityId: zod_1.z.number().int().positive().optional().nullable(),
        isPublished: zod_1.z.boolean().optional(),
        featured: zod_1.z.boolean().optional(),
    }),
});
const setAssetValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        assetKey: zod_1.z.string().min(1, 'Asset key is required'),
        url: zod_1.z.string().min(1, 'Asset URL is required'),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        org: zod_1.z.nativeEnum(client_1.Organization).optional().default(client_1.Organization.RUIL),
        category: zod_1.z.string().optional().default('ASSET'),
        mediaType: zod_1.z.nativeEnum(client_1.MediaType).optional().default(client_1.MediaType.IMAGE),
        thumbnail: zod_1.z.string().optional().nullable(),
        activityId: zod_1.z.number().int().positive().optional().nullable(),
    }),
});
exports.GalleryValidation = {
    createGalleryItemValidationSchema,
    updateGalleryItemValidationSchema,
    setAssetValidationSchema,
};

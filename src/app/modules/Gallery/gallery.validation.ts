import { z } from 'zod';
import { Organization, MediaType } from '@prisma/client';

const createGalleryItemValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional().default(Organization.RUIL),
    title: z.string().optional(),
    description: z.string().optional(),
    mediaType: z.nativeEnum(MediaType).optional().default(MediaType.IMAGE),
    url: z.string().min(1, 'Media URL is required'),
    thumbnail: z.string().optional().nullable(),
    assetKey: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    activityId: z.number().int().positive().optional().nullable(),
    isPublished: z.boolean().optional().default(true),
    featured: z.boolean().optional().default(false),
  }),
});

const updateGalleryItemValidationSchema = z.object({
  body: z.object({
    org: z.nativeEnum(Organization).optional(),
    title: z.string().optional(),
    description: z.string().optional().nullable(),
    mediaType: z.nativeEnum(MediaType).optional(),
    url: z.string().min(1).optional(),
    thumbnail: z.string().optional().nullable(),
    assetKey: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    activityId: z.number().int().positive().optional().nullable(),
    isPublished: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
});

const setAssetValidationSchema = z.object({
  body: z.object({
    assetKey: z.string().min(1, 'Asset key is required'),
    url: z.string().min(1, 'Asset URL is required'),
    title: z.string().optional(),
    description: z.string().optional(),
    org: z.nativeEnum(Organization).optional().default(Organization.RUIL),
    category: z.string().optional().default('ASSET'),
    mediaType: z.nativeEnum(MediaType).optional().default(MediaType.IMAGE),
    thumbnail: z.string().optional().nullable(),
    activityId: z.number().int().positive().optional().nullable(),
  }),
});

export const GalleryValidation = {
  createGalleryItemValidationSchema,
  updateGalleryItemValidationSchema,
  setAssetValidationSchema,
};

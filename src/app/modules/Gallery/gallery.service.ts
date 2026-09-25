import httpStatus from 'http-status';
import { Organization, MediaType, Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import {
  TCreateGalleryItem,
  TUpdateGalleryItem,
  TSetAssetPayload,
} from './gallery.interface';

const createGalleryItemIntoDB = async (payload: TCreateGalleryItem) => {
  if (payload.assetKey) {
    const existing = await prisma.galleryItem.findUnique({
      where: { assetKey: payload.assetKey },
    });
    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `An asset with key "${payload.assetKey}" already exists!`,
      );
    }
  }

  return await prisma.galleryItem.create({
    data: {
      org: payload.org || Organization.RUIL,
      title: payload.title,
      description: payload.description,
      mediaType: payload.mediaType || MediaType.IMAGE,
      url: payload.url,
      thumbnail: payload.thumbnail,
      assetKey: payload.assetKey || null,
      category: payload.category || null,
      activityId: payload.activityId || null,
      isPublished: payload.isPublished !== undefined ? payload.isPublished : true,
      featured: payload.featured !== undefined ? payload.featured : false,
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
};

const getAllGalleryItemsFromDB = async (query: Record<string, unknown>) => {
  const {
    category,
    org,
    mediaType,
    activityId,
    isPublished,
    featured,
    isAsset,
    ...queryParams
  } = query;

  const galleryQuery = new QueryBuilder(
    prisma.galleryItem,
    { ...queryParams },
    {
      searchableFields: ['title', 'description', 'category', 'assetKey'],
      filterableFields: [],
    },
  )
    .search()
    .filter()
    .paginate()
    .fields();

  if (category && category !== 'ALL') {
    galleryQuery.where({ category: String(category) });
  }

  if (org && org !== 'ALL') {
    if (typeof org === 'string' && org.includes(',')) {
      const orgList = org.split(',').map((o) => o.trim()) as Organization[];
      galleryQuery.where({ org: { in: orgList } });
    } else {
      galleryQuery.where({ org: org as Organization });
    }
  }

  if (mediaType && mediaType !== 'ALL') {
    galleryQuery.where({ mediaType: mediaType as MediaType });
  }

  if (activityId) {
    galleryQuery.where({ activityId: Number(activityId) });
  }

  if (isPublished !== undefined && isPublished !== 'ALL') {
    const pubBool = isPublished === 'true' || isPublished === true;
    galleryQuery.where({ isPublished: pubBool });
  }

  if (featured !== undefined && featured !== 'ALL') {
    const featBool = featured === 'true' || featured === true;
    galleryQuery.where({ featured: featBool });
  }

  if (isAsset === 'true' || isAsset === true) {
    galleryQuery.where({ assetKey: { not: null } });
  } else if (isAsset === 'false' || isAsset === false) {
    galleryQuery.where({ assetKey: null });
  }

  galleryQuery.orderBy({ createdAt: 'desc' });

  galleryQuery.include({
    activity: {
      select: {
        id: true,
        title: true,
        slug: true,
      },
    },
  });

  return await galleryQuery.execute();
};

const getGalleryItemByIdFromDB = async (id: number) => {
  const item = await prisma.galleryItem.findUnique({
    where: { id },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Gallery item not found!');
  }

  return item;
};

const updateGalleryItemInDB = async (
  id: number,
  payload: TUpdateGalleryItem,
) => {
  const item = await prisma.galleryItem.findUnique({ where: { id } });

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Gallery item not found!');
  }

  if (payload.assetKey && payload.assetKey !== item.assetKey) {
    const existing = await prisma.galleryItem.findUnique({
      where: { assetKey: payload.assetKey },
    });
    if (existing && existing.id !== id) {
      throw new AppError(
        httpStatus.CONFLICT,
        `An asset with key "${payload.assetKey}" already exists!`,
      );
    }
  }

  return await prisma.galleryItem.update({
    where: { id },
    data: payload,
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
};

const deleteGalleryItemFromDB = async (id: number) => {
  const item = await prisma.galleryItem.findUnique({ where: { id } });

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Gallery item not found!');
  }

  return await prisma.galleryItem.delete({ where: { id } });
};

const togglePublishInDB = async (id: number) => {
  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Gallery item not found!');
  }

  return await prisma.galleryItem.update({
    where: { id },
    data: { isPublished: !item.isPublished },
  });
};

const toggleFeatureInDB = async (id: number) => {
  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, 'Gallery item not found!');
  }

  return await prisma.galleryItem.update({
    where: { id },
    data: { featured: !item.featured },
  });
};

// ── Asset Management ────────────────────────────────────────────────────────

const getAssetByKeyFromDB = async (assetKey: string) => {
  const asset = await prisma.galleryItem.findUnique({
    where: { assetKey },
  });

  if (!asset) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Site asset "${assetKey}" not found!`,
    );
  }

  return asset;
};

const getAllAssetsFromDB = async (org?: Organization) => {
  const where: Prisma.GalleryItemWhereInput = {
    assetKey: { not: null },
  };

  if (org && org !== Organization.BOTH) {
    where.org = { in: [org, Organization.BOTH] };
  }

  const assets = await prisma.galleryItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  // Return both array and a key-value dictionary for easy frontend asset resolution
  const assetMap: Record<string, string> = {};
  assets.forEach((a) => {
    if (a.assetKey) {
      assetMap[a.assetKey] = a.url;
    }
  });

  return {
    items: assets,
    assetMap,
  };
};

const upsertAssetInDB = async (payload: TSetAssetPayload) => {
  return await prisma.galleryItem.upsert({
    where: { assetKey: payload.assetKey },
    update: {
      url: payload.url,
      title: payload.title,
      description: payload.description,
      org: payload.org || Organization.RUIL,
      category: payload.category || 'ASSET',
      mediaType: payload.mediaType || MediaType.IMAGE,
      thumbnail: payload.thumbnail,
      activityId: payload.activityId !== undefined ? payload.activityId : undefined,
      isPublished: true,
    },
    create: {
      assetKey: payload.assetKey,
      url: payload.url,
      title: payload.title || payload.assetKey,
      description: payload.description,
      org: payload.org || Organization.RUIL,
      category: payload.category || 'ASSET',
      mediaType: payload.mediaType || MediaType.IMAGE,
      thumbnail: payload.thumbnail,
      activityId: payload.activityId || null,
      isPublished: true,
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
};

const deleteAssetByKeyFromDB = async (assetKey: string) => {
  const asset = await prisma.galleryItem.findUnique({
    where: { assetKey },
  });

  if (!asset) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Site asset "${assetKey}" not found in database!`,
    );
  }

  return await prisma.galleryItem.delete({
    where: { assetKey },
  });
};

const getCategoriesFromDB = async (org?: string) => {
  const where: Prisma.GalleryItemWhereInput = {
    category: { not: null },
    assetKey: null, // Filter out internal asset keys from general gallery categories
    isPublished: true,
  };

  if (org && org !== 'ALL') {
    if (org.includes(',')) {
      const orgList = org.split(',').map((o) => o.trim()) as Organization[];
      where.org = { in: orgList };
    } else {
      where.org = org as Organization;
    }
  }

  const records = await prisma.galleryItem.findMany({
    where,
    select: { category: true },
    distinct: ['category'],
  });
  return records.map((r) => r.category).filter(Boolean) as string[];
};

export const GalleryService = {
  createGalleryItemIntoDB,
  getAllGalleryItemsFromDB,
  getGalleryItemByIdFromDB,
  updateGalleryItemInDB,
  deleteGalleryItemFromDB,
  deleteAssetByKeyFromDB,
  togglePublishInDB,
  toggleFeatureInDB,
  getAssetByKeyFromDB,
  getAllAssetsFromDB,
  upsertAssetInDB,
  getCategoriesFromDB,
};

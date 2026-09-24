import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreateActivity, TUpdateActivity } from './activity.interface';

/**
 * Generate a URL-safe slug from a title.
 * Appends a short timestamp suffix to guarantee uniqueness.
 */
const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `${base}-${Date.now().toString(36)}`;
};

const createActivityIntoDB = async (payload: TCreateActivity) => {
  const slug = generateSlug(payload.title);

  return await prisma.activity.create({
    data: {
      ...payload,
      slug,
    },
  });
};

const getAllActivitiesFromDB = async (query: Record<string, unknown>) => {
  const { status, org, ...queryParams } = query;

  const activityQuery = new QueryBuilder(
    prisma.activity,
    { ...queryParams },
    {
      searchableFields: ['title', 'category', 'description'],
      filterableFields: [],
    },
  )
    .search()
    .filter()
    .paginate()
    .fields();

  if (status && status !== 'ALL') {
    activityQuery.where({ status });
  }

  if (org && org !== 'ALL') {
    activityQuery.where({ org });
  }

  activityQuery.orderBy({ createdAt: 'desc' });

  // Include events count
  activityQuery.include({ _count: { select: { events: true } } });

  return await activityQuery.execute();
};

const getActivityByIdFromDB = async (idOrSlug: string) => {
  const isNumeric = /^\d+$/.test(idOrSlug);
  const where: Prisma.ActivityWhereUniqueInput = isNumeric
    ? { id: Number(idOrSlug) }
    : { slug: idOrSlug };

  const activity = await prisma.activity.findUnique({
    where,
    include: {
      _count: { select: { events: true } },
      events: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          bannerImage: true,
          _count: { select: { sessions: true, memberRecords: true } },
        },
        orderBy: { startDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!activity) {
    throw new AppError(httpStatus.NOT_FOUND, 'Activity not found!');
  }

  return activity;
};

const updateActivityInDB = async (id: number, payload: TUpdateActivity) => {
  const activity = await prisma.activity.findUnique({ where: { id } });

  if (!activity) {
    throw new AppError(httpStatus.NOT_FOUND, 'Activity not found!');
  }

  return await prisma.activity.update({
    where: { id },
    data: payload,
  });
};

const deleteActivityFromDB = async (id: number) => {
  const activity = await prisma.activity.findUnique({ where: { id } });

  if (!activity) {
    throw new AppError(httpStatus.NOT_FOUND, 'Activity not found!');
  }

  return await prisma.activity.delete({ where: { id } });
};

const getCategoriesFromDB = async () => {
  const records = await prisma.activity.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return records.map((r) => r.category).filter(Boolean) as string[];
};

export const ActivityService = {
  createActivityIntoDB,
  getAllActivitiesFromDB,
  getActivityByIdFromDB,
  updateActivityInDB,
  deleteActivityFromDB,
  getCategoriesFromDB,
};

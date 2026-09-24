import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreateEvent, TUpdateEvent } from './event.interface';

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

const createEventIntoDB = async (payload: TCreateEvent) => {
  const slug = generateSlug(payload.title);

  const eventData: Prisma.EventCreateInput = {
    title: payload.title,
    slug,
    org: payload.org,
    category: payload.category,
    status: payload.status,
    scheduleText: payload.scheduleText,
    location: payload.location,
    bannerImage: payload.bannerImage,
    startDate: payload.startDate ? new Date(payload.startDate) : null,
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    currentChapter: payload.currentChapter,
    metadata: payload.metadata ?? undefined,
    isActive: payload.isActive ?? true,
    activity: payload.activityId ? { connect: { id: payload.activityId } } : undefined,
  };

  return await prisma.event.create({
    data: eventData,
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

const getAllEventsFromDB = async (query: Record<string, unknown>) => {
  const { status, org, activityId, isActive, ...queryParams } = query;

  const eventQuery = new QueryBuilder(
    prisma.event,
    { ...queryParams },
    {
      searchableFields: ['title', 'category', 'location', 'scheduleText', 'currentChapter'],
      filterableFields: [],
    },
  )
    .search()
    .filter()
    .paginate()
    .fields();

  if (status && status !== 'ALL') {
    eventQuery.where({ status });
  }

  if (org && org !== 'ALL') {
    eventQuery.where({ org });
  }

  if (activityId) {
    eventQuery.where({ activityId: Number(activityId) });
  }

  if (isActive !== undefined) {
    eventQuery.where({ isActive: isActive === 'true' || isActive === true });
  }

  eventQuery.orderBy({ createdAt: 'desc' });

  eventQuery.include({
    activity: {
      select: {
        id: true,
        title: true,
        slug: true,
      },
    },
    _count: {
      select: {
        sessions: true,
        memberRecords: true,
      },
    },
  });

  return await eventQuery.execute();
};

const getEventByIdOrSlugFromDB = async (idOrSlug: string) => {
  const isNumeric = /^\d+$/.test(idOrSlug);
  const where: Prisma.EventWhereUniqueInput = isNumeric
    ? { id: Number(idOrSlug) }
    : { slug: idOrSlug };

  const event = await prisma.event.findUnique({
    where,
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
      sessions: {
        orderBy: { sessionDate: 'asc' },
        include: {
          _count: { select: { records: true } },
        },
      },
      memberRecords: {
        where: {
          comment: { not: null },
          isApproved: true,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          sessionDate: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          sessions: true,
          memberRecords: true,
        },
      },
    },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found!');
  }

  return event;
};

const updateEventInDB = async (id: number, payload: TUpdateEvent) => {
  const existingEvent = await prisma.event.findUnique({ where: { id } });

  if (!existingEvent) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found!');
  }

  const updateData: Prisma.EventUpdateInput = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.org !== undefined) updateData.org = payload.org;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.scheduleText !== undefined) updateData.scheduleText = payload.scheduleText;
  if (payload.location !== undefined) updateData.location = payload.location;
  if (payload.bannerImage !== undefined) updateData.bannerImage = payload.bannerImage;
  if (payload.currentChapter !== undefined) updateData.currentChapter = payload.currentChapter;
  if (payload.metadata !== undefined) updateData.metadata = payload.metadata ?? Prisma.JsonNull;
  if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

  if (payload.startDate !== undefined) {
    updateData.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.endDate !== undefined) {
    updateData.endDate = payload.endDate ? new Date(payload.endDate) : null;
  }

  if (payload.activityId !== undefined) {
    if (payload.activityId === null) {
      updateData.activity = { disconnect: true };
    } else {
      updateData.activity = { connect: { id: payload.activityId } };
    }
  }

  return await prisma.event.update({
    where: { id },
    data: updateData,
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

const deleteEventFromDB = async (id: number) => {
  const existingEvent = await prisma.event.findUnique({ where: { id } });

  if (!existingEvent) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found!');
  }

  return await prisma.event.delete({ where: { id } });
};

const getCategoriesFromDB = async () => {
  const records = await prisma.event.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return records.map((r) => r.category).filter(Boolean) as string[];
};

export const EventService = {
  createEventIntoDB,
  getAllEventsFromDB,
  getEventByIdOrSlugFromDB,
  updateEventInDB,
  deleteEventFromDB,
  getCategoriesFromDB,
};

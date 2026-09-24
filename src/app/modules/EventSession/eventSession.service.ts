import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import { TCreateEventSession, TUpdateEventSession } from './eventSession.interface';

const createSessionIntoDB = async (payload: TCreateEventSession) => {
  const event = await prisma.event.findUnique({
    where: { id: payload.eventId },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Target event not found!');
  }

  return await prisma.eventSession.create({
    data: {
      eventId: payload.eventId,
      sessionDate: new Date(payload.sessionDate),
      chapter: payload.chapter,
      summary: payload.summary,
      audioUrl: payload.audioUrl,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
};

const getSessionsByEventFromDB = async (eventId: number) => {
  return await prisma.eventSession.findMany({
    where: { eventId },
    orderBy: { sessionDate: 'asc' },
    include: {
      _count: {
        select: { records: true },
      },
    },
  });
};

const getSessionByIdFromDB = async (id: number) => {
  const session = await prisma.eventSession.findUnique({
    where: { id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      records: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { records: true },
      },
    },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event session not found!');
  }

  return session;
};

const updateSessionInDB = async (id: number, payload: TUpdateEventSession) => {
  const session = await prisma.eventSession.findUnique({ where: { id } });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event session not found!');
  }

  const updateData: Record<string, unknown> = {};
  if (payload.sessionDate !== undefined) {
    updateData.sessionDate = new Date(payload.sessionDate);
  }
  if (payload.chapter !== undefined) updateData.chapter = payload.chapter;
  if (payload.summary !== undefined) updateData.summary = payload.summary;
  if (payload.audioUrl !== undefined) updateData.audioUrl = payload.audioUrl;
  if (payload.eventId !== undefined) updateData.eventId = payload.eventId;

  return await prisma.eventSession.update({
    where: { id },
    data: updateData,
  });
};

const deleteSessionFromDB = async (id: number) => {
  const session = await prisma.eventSession.findUnique({ where: { id } });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event session not found!');
  }

  return await prisma.eventSession.delete({ where: { id } });
};

export const EventSessionService = {
  createSessionIntoDB,
  getSessionsByEventFromDB,
  getSessionByIdFromDB,
  updateSessionInDB,
  deleteSessionFromDB,
};

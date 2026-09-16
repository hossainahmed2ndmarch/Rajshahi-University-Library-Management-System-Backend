import httpStatus from 'http-status';
import { UserRole, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import { TCreateSchedule, TUpdateSchedule } from './shifterSchedule.interface';

const createScheduleInDB = async (payload: TCreateSchedule) => {
  return await prisma.shifterSchedule.create({
    data: {
      shifterId: payload.shifterId,
      dayOfWeek: payload.dayOfWeek,
      dayName: payload.dayName,
      dayEn: payload.dayEn,
      slot: payload.slot,
      slotName: payload.slotName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isActive: payload.isActive ?? true,
      notes: payload.notes,
    },
    include: {
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

const getAllSchedulesFromDB = async () => {
  return await prisma.shifterSchedule.findMany({
    where: {
      isActive: true,
      shifter: {
        role: { in: [UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        status: UserStatus.ACTIVE,
      },
    },
    include: {
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

const getTodayScheduleFromDB = async () => {
  const todayDayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat

  return await prisma.shifterSchedule.findMany({
    where: {
      isActive: true,
      dayOfWeek: todayDayOfWeek,
      shifter: {
        role: { in: [UserRole.SHIFTER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        status: UserStatus.ACTIVE,
      },
    },
    include: {
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });
};

const getMyScheduleFromDB = async (shifterId: number) => {
  return await prisma.shifterSchedule.findMany({
    where: { shifterId },
    include: {
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

const updateScheduleInDB = async (id: number, payload: TUpdateSchedule) => {
  const existing = await prisma.shifterSchedule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shifter schedule entry not found!');
  }

  return await prisma.shifterSchedule.update({
    where: { id },
    data: payload,
    include: {
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

const deleteScheduleInDB = async (id: number) => {
  const existing = await prisma.shifterSchedule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shifter schedule entry not found!');
  }

  return await prisma.shifterSchedule.delete({ where: { id } });
};

export const ShifterScheduleService = {
  createScheduleInDB,
  getAllSchedulesFromDB,
  getTodayScheduleFromDB,
  getMyScheduleFromDB,
  updateScheduleInDB,
  deleteScheduleInDB,
};

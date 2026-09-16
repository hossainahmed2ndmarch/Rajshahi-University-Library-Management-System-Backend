import httpStatus from 'http-status';
import { ShiftStatus, UserRole } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import {
  TCheckInShift,
  TCheckOutShift,
  TScheduleShift,
  TCancelShift,
  TRescheduleShift,
  TCompleteOfflineShift,
  TEmailAction,
} from './shiftLog.interface';
import {
  sendShiftScheduleAlert,
  sendShiftCancellationAlert,
} from '../../utils/notificationSender';

const resolveRecipients = async (
  currentUserId: number,
  targetRecipients?: 'ALL' | 'SHIFTER' | 'ADMIN' | 'SUPER_ADMIN' | string[] | number[]
) => {
  let whereClause: any = {
    id: { not: currentUserId },
    status: 'ACTIVE',
  };

  if (!targetRecipients || targetRecipients === 'ALL') {
    whereClause.role = {
      in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SHIFTER],
    };
  } else if (targetRecipients === 'SHIFTER') {
    whereClause.role = UserRole.SHIFTER;
  } else if (targetRecipients === 'ADMIN') {
    whereClause.role = { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] };
  } else if (targetRecipients === 'SUPER_ADMIN') {
    whereClause.role = UserRole.SUPER_ADMIN;
  } else if (Array.isArray(targetRecipients)) {
    const ids = targetRecipients.map((id) => Number(id)).filter((id) => !isNaN(id));
    if (ids.length > 0) {
      whereClause.id = { in: ids, not: currentUserId };
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  return users.map((u) => ({
    name: u.name,
    email: u.email,
    phone: u.phone || undefined,
    role: u.role,
  }));
};

const checkInShiftInDB = async (shifterId: number, payload: TCheckInShift) => {
  const activeShift = await prisma.shiftLog.findFirst({
    where: {
      shifterId,
      status: ShiftStatus.ACTIVE,
    },
  });

  if (activeShift) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You already have an active duty shift session!');
  }

  // Check if there is an existing SCHEDULED shift for today that can be activated
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const scheduledShift = await prisma.shiftLog.findFirst({
    where: {
      shifterId,
      status: ShiftStatus.SCHEDULED,
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (scheduledShift) {
    return await prisma.shiftLog.update({
      where: { id: scheduledShift.id },
      data: {
        status: ShiftStatus.ACTIVE,
        startTime: new Date(),
        openingCash: payload.openingCash,
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
  }

  return await prisma.shiftLog.create({
    data: {
      shifterId,
      startTime: new Date(),
      status: ShiftStatus.ACTIVE,
      openingCash: payload.openingCash,
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

const checkOutShiftInDB = async (shifterId: number, payload: TCheckOutShift) => {
  const activeShift = await prisma.shiftLog.findFirst({
    where: {
      shifterId,
      status: ShiftStatus.ACTIVE,
    },
  });

  if (!activeShift) {
    throw new AppError(httpStatus.NOT_FOUND, 'No active shift session found for check-out!');
  }

  return await prisma.shiftLog.update({
    where: { id: activeShift.id },
    data: {
      endTime: new Date(),
      status: ShiftStatus.COMPLETED,
      closingCash: payload.closingCash,
      cashCollected: payload.cashCollected ?? 0,
      tasksCompleted: payload.tasksCompleted || null,
      handoverNotes: payload.handoverNotes || null,
    },
    include: {
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const scheduleShiftInDB = async (shifterId: number, payload: TScheduleShift) => {
  const shifter = await prisma.user.findUnique({
    where: { id: shifterId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!shifter) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shifter user account not found!');
  }

  const startTime = new Date(payload.startTime);
  const endTime = payload.endTime ? new Date(payload.endTime) : undefined;

  const newShift = await prisma.shiftLog.create({
    data: {
      shifterId,
      startTime,
      endTime,
      status: ShiftStatus.SCHEDULED,
      openingCash: payload.openingCash ?? 500,
      tasksCompleted: payload.shiftSlotName ? `[Slot: ${payload.shiftSlotName}]` : undefined,
      handoverNotes: payload.notes || undefined,
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

  // Resolve recipients and send notifications asynchronously
  const recipients = await resolveRecipients(shifterId, payload.notifyRecipients);
  if (recipients.length > 0) {
    sendShiftScheduleAlert({
      shifterName: shifter.name,
      shifterEmail: shifter.email,
      shifterPhone: shifter.phone || undefined,
      shiftStartTime: startTime,
      shiftEndTime: endTime,
      shiftSlotName: payload.shiftSlotName,
      recipients,
      notificationMethod: payload.notificationMethod || 'EMAIL',
      notes: payload.notes,
    }).catch((err) => console.error('[Shift Schedule Notification Error]:', err));
  }

  return {
    shift: newShift,
    notifiedCount: recipients.length,
    recipients,
  };
};

const cancelShiftInDB = async (
  shiftId: number,
  currentUser: { userId: number; role: UserRole },
  payload: TCancelShift
) => {
  const shift = await prisma.shiftLog.findUnique({
    where: { id: shiftId },
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

  if (!shift) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shift session record not found!');
  }

  if (
    shift.shifterId !== currentUser.userId &&
    currentUser.role !== UserRole.SUPER_ADMIN &&
    currentUser.role !== UserRole.ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to cancel this duty shift!');
  }

  if (shift.status === ShiftStatus.COMPLETED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot cancel a completed shift!');
  }

  const updatedNotes = shift.handoverNotes
    ? `${shift.handoverNotes}\n[Cancelled]: ${payload.reason}`
    : `[Cancelled]: ${payload.reason}`;

  const updatedShift = await prisma.shiftLog.update({
    where: { id: shiftId },
    data: {
      status: ShiftStatus.CANCELLED,
      endTime: new Date(),
      handoverNotes: updatedNotes,
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

  // Resolve recipients and send notifications asynchronously
  const recipients = await resolveRecipients(currentUser.userId, payload.notifyRecipients);
  if (recipients.length > 0) {
    sendShiftCancellationAlert({
      shifterName: shift.shifter.name,
      shifterEmail: shift.shifter.email,
      shifterPhone: shift.shifter.phone || undefined,
      shiftStartTime: shift.startTime,
      shiftEndTime: shift.endTime || undefined,
      shiftSlotName: shift.tasksCompleted || 'Duty Shift',
      recipients,
      notificationMethod: payload.notificationMethod || 'EMAIL',
      reason: payload.reason,
    }).catch((err) => console.error('[Shift Cancellation Notification Error]:', err));
  }

  return {
    shift: updatedShift,
    notifiedCount: recipients.length,
    recipients,
  };
};

const getAllShiftLogsFromDB = async (query: Record<string, unknown>) => {
  const shiftLogQuery = new QueryBuilder(prisma.shiftLog, query, {
    searchableFields: ['tasksCompleted', 'handoverNotes'],
    filterableFields: ['status', 'shifterId', 'verifiedById'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      shifter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      verifiedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

  return await shiftLogQuery.execute();
};

const deleteShiftLogInDB = async (id: number) => {
  const shift = await prisma.shiftLog.findUnique({
    where: { id },
  });

  if (!shift) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shift log record not found!');
  }

  return await prisma.shiftLog.delete({
    where: { id },
  });
};

const getActiveShiftFromDB = async () => {
  return await prisma.shiftLog.findFirst({
    where: { status: ShiftStatus.ACTIVE },
    include: {
      shifter: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { startTime: 'desc' },
  });
};

const rescheduleShiftInDB = async (
  shiftId: number,
  currentUser: { userId: number; role: UserRole },
  payload: TRescheduleShift
) => {
  const shift = await prisma.shiftLog.findUnique({
    where: { id: shiftId },
    include: {
      shifter: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!shift) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shift session record not found!');
  }

  if (
    shift.shifterId !== currentUser.userId &&
    currentUser.role !== UserRole.SUPER_ADMIN &&
    currentUser.role !== UserRole.ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to reschedule this shift!');
  }

  if (shift.status === ShiftStatus.COMPLETED || shift.status === ShiftStatus.CANCELLED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot reschedule a completed or cancelled shift!');
  }

  const newStartTime = new Date(payload.newStartTime);
  const newEndTime = payload.newEndTime ? new Date(payload.newEndTime) : undefined;

  const updatedShift = await prisma.shiftLog.update({
    where: { id: shiftId },
    data: {
      rescheduledTo: shift.startTime, // Save old start time
      startTime: newStartTime,
      endTime: newEndTime,
      handoverNotes: payload.reason
        ? `${shift.handoverNotes || ''}\n[Rescheduled]: ${payload.reason}`.trim()
        : shift.handoverNotes,
    },
    include: {
      shifter: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  const recipients = await resolveRecipients(currentUser.userId, payload.notifyRecipients);
  if (recipients.length > 0) {
    sendShiftScheduleAlert({
      shifterName: shift.shifter.name,
      shifterEmail: shift.shifter.email,
      shifterPhone: shift.shifter.phone || undefined,
      shiftStartTime: newStartTime,
      shiftEndTime: newEndTime,
      shiftSlotName: shift.shiftSlotName || 'Rescheduled Duty Shift',
      recipients,
      notificationMethod: payload.notificationMethod || 'EMAIL',
      notes: payload.reason ? `Rescheduled: ${payload.reason}` : undefined,
    }).catch((err) => console.error('[Shift Reschedule Notification Error]:', err));
  }

  return { shift: updatedShift, notifiedCount: recipients.length };
};

const completeOfflineShiftInDB = async (
  shiftId: number,
  currentUser: { userId: number; role: UserRole },
  payload: TCompleteOfflineShift
) => {
  const shift = await prisma.shiftLog.findUnique({
    where: { id: shiftId },
    include: {
      shifter: { select: { id: true, name: true, email: true } },
    },
  });

  if (!shift) {
    throw new AppError(httpStatus.NOT_FOUND, 'Shift session record not found!');
  }

  if (
    shift.shifterId !== currentUser.userId &&
    currentUser.role !== UserRole.SUPER_ADMIN &&
    currentUser.role !== UserRole.ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to complete this shift!');
  }

  if (shift.status === ShiftStatus.COMPLETED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This shift is already marked as completed!');
  }

  return await prisma.shiftLog.update({
    where: { id: shiftId },
    data: {
      status: ShiftStatus.COMPLETED,
      openingCash: payload.openingCash,
      closingCash: payload.closingCash,
      cashCollected: payload.cashCollected,
      tasksCompleted: payload.tasksCompleted || null,
      handoverNotes: payload.handoverNotes || null,
      isOfflineRecord: payload.isOfflineRecord ?? true,
      endTime: shift.endTime || new Date(),
    },
    include: {
      shifter: { select: { id: true, name: true, email: true } },
    },
  });
};

const emailActionShiftInDB = async (payload: TEmailAction) => {
  const shift = await prisma.shiftLog.findFirst({
    where: { actionToken: payload.token },
  });

  if (!shift) {
    throw new AppError(httpStatus.NOT_FOUND, 'Invalid or expired action token!');
  }

  if (shift.status === ShiftStatus.COMPLETED || shift.status === ShiftStatus.CANCELLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Shift is already ${shift.status.toLowerCase()}. Action not applicable.`
    );
  }

  if (payload.action === 'START') {
    return await prisma.shiftLog.update({
      where: { id: shift.id },
      data: {
        status: ShiftStatus.ACTIVE,
        startTime: new Date(),
        openingCash: payload.openingCash ?? 0,
        actionToken: null, // single-use token cleared
      },
    });
  }

  // CANCEL action
  return await prisma.shiftLog.update({
    where: { id: shift.id },
    data: {
      status: ShiftStatus.CANCELLED,
      endTime: new Date(),
      cancellationReason: payload.cancelReason || 'Cancelled via email link',
      actionToken: null,
    },
  });
};

export const ShiftLogService = {
  checkInShiftInDB,
  checkOutShiftInDB,
  scheduleShiftInDB,
  cancelShiftInDB,
  getAllShiftLogsFromDB,
  deleteShiftLogInDB,
  getActiveShiftFromDB,
  rescheduleShiftInDB,
  completeOfflineShiftInDB,
  emailActionShiftInDB,
};

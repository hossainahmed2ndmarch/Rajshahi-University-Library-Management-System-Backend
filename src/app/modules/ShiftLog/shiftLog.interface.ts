import { ShiftStatus } from '@prisma/client';

export type TCheckInShift = {
  openingCash: number;
};

export type TCheckOutShift = {
  closingCash: number;
  cashCollected?: number;
  tasksCompleted?: string;
  handoverNotes?: string;
};

export type TScheduleShift = {
  startTime: string | Date;
  endTime?: string | Date;
  shiftSlotName?: string;
  openingCash?: number;
  notes?: string;
  notifyRecipients?: 'ALL' | 'SHIFTER' | 'ADMIN' | 'SUPER_ADMIN' | string[] | number[];
  notificationMethod?: 'EMAIL' | 'SMS' | 'SOCIAL_MEDIA' | 'ALL';
};

export type TCancelShift = {
  reason: string;
  notifyRecipients?: 'ALL' | 'SHIFTER' | 'ADMIN' | 'SUPER_ADMIN' | string[] | number[];
  notificationMethod?: 'EMAIL' | 'SMS' | 'SOCIAL_MEDIA' | 'ALL';
};

export type TShiftLogFilter = {
  shifterId?: number | string;
  status?: ShiftStatus;
  searchTerm?: string;
};

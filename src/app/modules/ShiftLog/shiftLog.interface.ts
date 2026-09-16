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

export type TRescheduleShift = {
  newStartTime: string | Date;
  newEndTime?: string | Date;
  reason?: string;
  notifyRecipients?: 'ALL' | 'SHIFTER' | 'ADMIN' | 'SUPER_ADMIN' | string[] | number[];
  notificationMethod?: 'EMAIL' | 'SMS' | 'SOCIAL_MEDIA' | 'ALL';
};

export type TCompleteOfflineShift = {
  openingCash: number;
  closingCash: number;
  cashCollected: number;
  tasksCompleted?: string;
  handoverNotes?: string;
  isOfflineRecord?: boolean;
};

export type TEmailAction = {
  token: string;
  action: 'START' | 'CANCEL';
  cancelReason?: string;
  openingCash?: number;
};

export type TShiftLogFilter = {
  shifterId?: number | string;
  status?: ShiftStatus;
  searchTerm?: string;
};

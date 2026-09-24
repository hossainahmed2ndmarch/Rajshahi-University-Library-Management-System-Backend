import { EventStatus, Organization, Prisma } from '@prisma/client';

export interface TCreateEvent {
  org?: Organization;
  activityId?: number | null;
  title: string;
  category?: string;
  status?: EventStatus;
  scheduleText?: string;
  location?: string;
  bannerImage?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  currentChapter?: string;
  metadata?: Prisma.InputJsonValue;
  isActive?: boolean;
}

export interface TUpdateEvent {
  org?: Organization;
  activityId?: number | null;
  title?: string;
  category?: string;
  status?: EventStatus;
  scheduleText?: string;
  location?: string;
  bannerImage?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  currentChapter?: string;
  metadata?: Prisma.InputJsonValue;
  isActive?: boolean;
}

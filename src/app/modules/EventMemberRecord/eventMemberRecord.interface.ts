import { AttendanceStatus } from '@prisma/client';

export interface TBulkAttendanceItem {
  eventId: number;
  userId: number;
  sessionId?: number | null;
  sessionDate?: string | Date | null;
  status: AttendanceStatus;
}

export interface TSubmitFeedback {
  eventId: number;
  sessionId?: number | null;
  sessionDate?: string | Date | null;
  rating?: number;
  comment: string;
}

export interface TSelfAttendance {
  eventId: number;
  sessionId?: number | null;
  sessionDate?: string | Date | null;
  status?: AttendanceStatus;
}

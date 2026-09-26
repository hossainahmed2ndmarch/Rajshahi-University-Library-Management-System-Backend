import httpStatus from 'http-status';
import { AttendanceStatus, Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import {
  TBulkAttendanceItem,
  TSubmitFeedback,
  TSelfAttendance,
  TCampaignSubmission,
} from './eventMemberRecord.interface';

const normalizeDate = (dateVal?: string | Date | null): Date | null => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return new Date(d.toISOString().slice(0, 10));
};

const bulkMarkAttendanceIntoDB = async (items: TBulkAttendanceItem[]) => {
  const results = [];

  for (const item of items) {
    const sessionDate = normalizeDate(item.sessionDate);

    // Look for existing record
    const existing = await prisma.eventMemberRecord.findFirst({
      where: {
        eventId: item.eventId,
        userId: item.userId,
        sessionDate: sessionDate ?? undefined,
      },
    });

    if (existing) {
      const updated = await prisma.eventMemberRecord.update({
        where: { id: existing.id },
        data: {
          status: item.status,
          sessionId: item.sessionId !== undefined ? item.sessionId : existing.sessionId,
        },
      });
      results.push(updated);
    } else {
      const created = await prisma.eventMemberRecord.create({
        data: {
          eventId: item.eventId,
          userId: item.userId,
          sessionId: item.sessionId || null,
          sessionDate,
          status: item.status,
          isApproved: true,
        },
      });
      results.push(created);
    }
  }

  return results;
};

const submitFeedbackIntoDB = async (userId: number, payload: TSubmitFeedback) => {
  const sessionDate = normalizeDate(payload.sessionDate);

  // Check event configuration
  const event = await prisma.event.findUnique({
    where: { id: payload.eventId },
    select: { id: true, metadata: true },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found!');
  }

  const meta = (event.metadata as any) || {};
  const allowOpenFeedback = Boolean(
    meta.allowOpenFeedback || meta.allowFeedbackWithoutAttendance
  );

  // Check if attendance already recorded by admin for this user & event
  let record = await prisma.eventMemberRecord.findFirst({
    where: {
      eventId: payload.eventId,
      userId,
      ...(sessionDate ? { sessionDate } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // If sessionDate was provided but not found, fallback to any attendance record for this event
  if (!record && sessionDate) {
    record = await prisma.eventMemberRecord.findFirst({
      where: {
        eventId: payload.eventId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (record) {
    // Update existing attendance record with feedback and set isApproved to false for admin review
    return await prisma.eventMemberRecord.update({
      where: { id: record.id },
      data: {
        rating: payload.rating !== undefined ? payload.rating : record.rating,
        comment: payload.comment,
        isApproved: false, // Requires admin or super admin approval
      },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  // If no record exists, verify if admin allowed open feedback for this event
  if (!allowOpenFeedback) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Feedback can only be submitted after your attendance has been recorded by an administrator!',
    );
  }

  // Create record with INTERESTED status so user is not incorrectly counted as attendee
  return await prisma.eventMemberRecord.create({
    data: {
      eventId: payload.eventId,
      userId,
      sessionId: payload.sessionId || null,
      sessionDate,
      status: AttendanceStatus.INTERESTED,
      rating: payload.rating !== undefined ? payload.rating : 5,
      comment: payload.comment,
      isApproved: false,
    },
    include: {
      event: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
};

const recordSelfAttendanceIntoDB = async (userId: number, payload: TSelfAttendance) => {
  const sessionDate = normalizeDate(payload.sessionDate);

  const existing = await prisma.eventMemberRecord.findFirst({
    where: {
      eventId: payload.eventId,
      userId,
      ...(sessionDate ? { sessionDate } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    // If admin already assigned an attendance status
    return {
      message: 'Attendance record already exists for this event.',
      record: existing,
      alreadyRecorded: true,
    };
  }

  // Create interest or check-in
  const newRecord = await prisma.eventMemberRecord.create({
    data: {
      eventId: payload.eventId,
      userId,
      sessionId: payload.sessionId || null,
      sessionDate,
      status: payload.status || AttendanceStatus.INTERESTED,
      isApproved: true,
    },
    include: {
      event: { select: { id: true, title: true } },
    },
  });

  return {
    message: 'Attendance registered successfully.',
    record: newRecord,
    alreadyRecorded: false,
  };
};

const approveFeedbackInDB = async (recordId: number, isApproved: boolean) => {
  const record = await prisma.eventMemberRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'Member record not found!');
  }

  return await prisma.eventMemberRecord.update({
    where: { id: recordId },
    data: { isApproved },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const getRecordsByEventFromDB = async (eventId: number, query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = { eventId };

  if (query.status && query.status !== 'ALL') {
    where.status = query.status as AttendanceStatus;
  }

  if (query.isApproved !== undefined && query.isApproved !== 'ALL') {
    where.isApproved = query.isApproved === 'true' || query.isApproved === true;
  }

  if (query.hasFeedback === 'true') {
    where.OR = [
      { comment: { not: null } },
      { submissionData: { not: Prisma.JsonNull } },
    ];
  }

  const [total, records] = await Promise.all([
    prisma.eventMemberRecord.count({ where }),
    prisma.eventMemberRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
          },
        },
        session: {
          select: {
            id: true,
            sessionDate: true,
            chapter: true,
          },
        },
      },
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: records,
  };
};

const getMyRecordsFromDB = async (userId: number, eventId?: number) => {
  const where: any = { userId };
  if (eventId) {
    where.eventId = eventId;
  }

  return await prisma.eventMemberRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          bannerImage: true,
          startDate: true,
          location: true,
        },
      },
      session: {
        select: {
          id: true,
          sessionDate: true,
          chapter: true,
        },
      },
    },
  });
};

const getEventAttendanceStatsFromDB = async (eventId: number) => {
  const records = await prisma.eventMemberRecord.findMany({
    where: { eventId },
    select: {
      status: true,
      rating: true,
      comment: true,
      isApproved: true,
    },
  });

  const total = records.length;
  let present = 0;
  let absent = 0;
  let excused = 0;
  let interested = 0;
  let completed = 0;
  let totalRating = 0;
  let ratingCount = 0;

  for (const r of records) {
    if (r.status === AttendanceStatus.PRESENT) present++;
    else if (r.status === AttendanceStatus.ABSENT) absent++;
    else if (r.status === AttendanceStatus.EXCUSED) excused++;
    else if (r.status === AttendanceStatus.INTERESTED) interested++;
    else if (r.status === AttendanceStatus.COMPLETED) completed++;

    if (r.rating && r.isApproved) {
      totalRating += r.rating;
      ratingCount++;
    }
  }

  // Participants/attendees MUST ONLY count users who are actually present at the event!
  const attendeesCount = present + completed;

  return {
    eventId,
    total: attendeesCount,
    attendees: attendeesCount,
    participants: attendeesCount,
    interested,
    totalRegistered: records.length,
    present,
    absent,
    excused,
    completed,
    averageRating: ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : 0,
    approvedFeedbackCount: records.filter((r) => r.comment && r.isApproved).length,
    pendingFeedbackCount: records.filter((r) => r.comment && !r.isApproved).length,
  };
};

const submitCampaignIntoDB = async (
  payload: TCampaignSubmission,
  userId?: number | null,
) => {
  const sessionDate = normalizeDate(payload.sessionDate);

  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: payload.eventId },
    select: { id: true, metadata: true },
  });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found!');
  }

  // For authenticated users: try to find existing record and update it
  if (userId) {
    const existing = await prisma.eventMemberRecord.findFirst({
      where: {
        eventId: payload.eventId,
        userId,
        ...(sessionDate ? { sessionDate } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return await prisma.eventMemberRecord.update({
        where: { id: existing.id },
        data: {
          submissionData: payload.submissionData,
          rating: payload.rating !== undefined ? payload.rating : existing.rating,
          comment: payload.comment || existing.comment,
          isApproved: false, // Requires admin review
        },
        include: {
          event: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
    }

    // Create a new record with INTERESTED status for authenticated user
    return await prisma.eventMemberRecord.create({
      data: {
        eventId: payload.eventId,
        userId,
        sessionId: payload.sessionId || null,
        sessionDate,
        status: AttendanceStatus.INTERESTED,
        submissionData: payload.submissionData,
        rating: payload.rating,
        comment: payload.comment,
        isApproved: false,
      },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // For guests (non-users): always create a new record without userId
  return await prisma.eventMemberRecord.create({
    data: {
      eventId: payload.eventId,
      sessionId: payload.sessionId || null,
      sessionDate,
      status: AttendanceStatus.INTERESTED,
      submissionData: payload.submissionData,
      rating: payload.rating,
      comment: payload.comment,
      isApproved: false,
    },
    include: {
      event: { select: { id: true, title: true } },
    },
  });
};

const publishRecordAsArticleInDB = async (
  recordId: number,
  requestingUserId: number,
  payload?: { title?: string; authorDesignation?: string; category?: string; coverImage?: string },
) => {
  const record = await prisma.eventMemberRecord.findUnique({
    where: { id: recordId },
    include: {
      event: { select: { id: true, title: true, bannerImage: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, 'Member record not found!');
  }

  const subData = (record.submissionData as Record<string, any>) || {};

  const authorName =
    record.user?.name ||
    subData.name ||
    subData.authorName ||
    'শুভাকাঙ্ক্ষী লেখক';

  const authorDesignation =
    payload?.authorDesignation ||
    subData.institution ||
    subData.subject ||
    (record.user ? 'RUIL সদস্য' : 'ক্যাম্পেইন অংশগ্রহণকারী');

  const title =
    payload?.title ||
    subData.khutbaTopic ||
    subData.topic ||
    subData.title ||
    `${record.event.title} - শিক্ষণীয় প্রবন্ধ`;

  let content =
    subData.khutbaLesson ||
    subData.story ||
    subData.content ||
    subData.takeaways ||
    record.comment ||
    '';

  if (!content) {
    content = `${authorName} এর অনুভূতি ও শিক্ষণীয় আলোচনা।`;
  }

  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const uniqueSlug = `${baseSlug || 'campaign-article'}-${Date.now().toString(36)}`;

  const article = await prisma.article.create({
    data: {
      title,
      slug: uniqueSlug,
      content,
      coverImage: payload?.coverImage || record.event.bannerImage || null,
      category: payload?.category || 'ক্যাম্পেইন',
      authorUserId: record.userId || null,
      authorName,
      authorDesignation,
      isPublished: true,
    },
  });

  const updatedRecord = await prisma.eventMemberRecord.update({
    where: { id: recordId },
    data: { isApproved: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } },
    },
  });

  return {
    article,
    record: updatedRecord,
  };
};

export const EventMemberRecordService = {
  bulkMarkAttendanceIntoDB,
  submitFeedbackIntoDB,
  submitCampaignIntoDB,
  recordSelfAttendanceIntoDB,
  approveFeedbackInDB,
  publishRecordAsArticleInDB,
  getRecordsByEventFromDB,
  getMyRecordsFromDB,
  getEventAttendanceStatsFromDB,
};

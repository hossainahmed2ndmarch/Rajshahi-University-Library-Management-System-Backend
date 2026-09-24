"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMemberRecordService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const normalizeDate = (dateVal) => {
    if (!dateVal)
        return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime()))
        return null;
    return new Date(d.toISOString().slice(0, 10));
};
const bulkMarkAttendanceIntoDB = (items) => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    for (const item of items) {
        const sessionDate = normalizeDate(item.sessionDate);
        // Look for existing record
        const existing = yield db_1.default.eventMemberRecord.findFirst({
            where: {
                eventId: item.eventId,
                userId: item.userId,
                sessionDate: sessionDate !== null && sessionDate !== void 0 ? sessionDate : undefined,
            },
        });
        if (existing) {
            const updated = yield db_1.default.eventMemberRecord.update({
                where: { id: existing.id },
                data: {
                    status: item.status,
                    sessionId: item.sessionId !== undefined ? item.sessionId : existing.sessionId,
                },
            });
            results.push(updated);
        }
        else {
            const created = yield db_1.default.eventMemberRecord.create({
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
});
const submitFeedbackIntoDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionDate = normalizeDate(payload.sessionDate);
    // Check event configuration
    const event = yield db_1.default.event.findUnique({
        where: { id: payload.eventId },
        select: { id: true, metadata: true },
    });
    if (!event) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event not found!');
    }
    const meta = event.metadata || {};
    const allowOpenFeedback = Boolean(meta.allowOpenFeedback || meta.allowFeedbackWithoutAttendance);
    // Check if attendance already recorded by admin for this user & event
    let record = yield db_1.default.eventMemberRecord.findFirst({
        where: Object.assign({ eventId: payload.eventId, userId }, (sessionDate ? { sessionDate } : {})),
        orderBy: { createdAt: 'desc' },
    });
    // If sessionDate was provided but not found, fallback to any attendance record for this event
    if (!record && sessionDate) {
        record = yield db_1.default.eventMemberRecord.findFirst({
            where: {
                eventId: payload.eventId,
                userId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    if (record) {
        // Update existing attendance record with feedback and set isApproved to false for admin review
        return yield db_1.default.eventMemberRecord.update({
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
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Feedback can only be submitted after your attendance has been recorded by an administrator!');
    }
    // Create record with INTERESTED status so user is not incorrectly counted as attendee
    return yield db_1.default.eventMemberRecord.create({
        data: {
            eventId: payload.eventId,
            userId,
            sessionId: payload.sessionId || null,
            sessionDate,
            status: client_1.AttendanceStatus.INTERESTED,
            rating: payload.rating !== undefined ? payload.rating : 5,
            comment: payload.comment,
            isApproved: false,
        },
        include: {
            event: { select: { id: true, title: true } },
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
    });
});
const recordSelfAttendanceIntoDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionDate = normalizeDate(payload.sessionDate);
    const existing = yield db_1.default.eventMemberRecord.findFirst({
        where: Object.assign({ eventId: payload.eventId, userId }, (sessionDate ? { sessionDate } : {})),
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
    const newRecord = yield db_1.default.eventMemberRecord.create({
        data: {
            eventId: payload.eventId,
            userId,
            sessionId: payload.sessionId || null,
            sessionDate,
            status: payload.status || client_1.AttendanceStatus.INTERESTED,
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
});
const approveFeedbackInDB = (recordId, isApproved) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield db_1.default.eventMemberRecord.findUnique({
        where: { id: recordId },
    });
    if (!record) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Member record not found!');
    }
    return yield db_1.default.eventMemberRecord.update({
        where: { id: recordId },
        data: { isApproved },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });
});
const getRecordsByEventFromDB = (eventId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where = { eventId };
    if (query.status && query.status !== 'ALL') {
        where.status = query.status;
    }
    if (query.isApproved !== undefined && query.isApproved !== 'ALL') {
        where.isApproved = query.isApproved === 'true' || query.isApproved === true;
    }
    if (query.hasFeedback === 'true') {
        where.comment = { not: null };
    }
    const [total, records] = yield Promise.all([
        db_1.default.eventMemberRecord.count({ where }),
        db_1.default.eventMemberRecord.findMany({
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
});
const getMyRecordsFromDB = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const where = { userId };
    if (eventId) {
        where.eventId = eventId;
    }
    return yield db_1.default.eventMemberRecord.findMany({
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
});
const getEventAttendanceStatsFromDB = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const records = yield db_1.default.eventMemberRecord.findMany({
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
        if (r.status === client_1.AttendanceStatus.PRESENT)
            present++;
        else if (r.status === client_1.AttendanceStatus.ABSENT)
            absent++;
        else if (r.status === client_1.AttendanceStatus.EXCUSED)
            excused++;
        else if (r.status === client_1.AttendanceStatus.INTERESTED)
            interested++;
        else if (r.status === client_1.AttendanceStatus.COMPLETED)
            completed++;
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
});
exports.EventMemberRecordService = {
    bulkMarkAttendanceIntoDB,
    submitFeedbackIntoDB,
    recordSelfAttendanceIntoDB,
    approveFeedbackInDB,
    getRecordsByEventFromDB,
    getMyRecordsFromDB,
    getEventAttendanceStatsFromDB,
};

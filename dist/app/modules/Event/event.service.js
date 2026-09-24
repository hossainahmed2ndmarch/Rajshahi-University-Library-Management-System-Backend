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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const generateSlug = (title) => {
    const base = title
        .toLowerCase()
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/[^\w\s\u0980-\u09FF-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return `${base}-${Date.now().toString(36)}`;
};
const createEventIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const slug = generateSlug(payload.title);
    const eventData = {
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
        metadata: (_a = payload.metadata) !== null && _a !== void 0 ? _a : undefined,
        isActive: (_b = payload.isActive) !== null && _b !== void 0 ? _b : true,
        activity: payload.activityId ? { connect: { id: payload.activityId } } : undefined,
    };
    return yield db_1.default.event.create({
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
});
const getAllEventsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, org, activityId, isActive } = query, queryParams = __rest(query, ["status", "org", "activityId", "isActive"]);
    const eventQuery = new queryBuilder_1.default(db_1.default.event, Object.assign({}, queryParams), {
        searchableFields: ['title', 'category', 'location', 'scheduleText', 'currentChapter'],
        filterableFields: [],
    })
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
    return yield eventQuery.execute();
});
const getEventByIdOrSlugFromDB = (idOrSlug) => __awaiter(void 0, void 0, void 0, function* () {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const where = isNumeric
        ? { id: Number(idOrSlug) }
        : { slug: idOrSlug };
    const event = yield db_1.default.event.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event not found!');
    }
    return event;
});
const updateEventInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existingEvent = yield db_1.default.event.findUnique({ where: { id } });
    if (!existingEvent) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event not found!');
    }
    const updateData = {};
    if (payload.title !== undefined)
        updateData.title = payload.title;
    if (payload.org !== undefined)
        updateData.org = payload.org;
    if (payload.category !== undefined)
        updateData.category = payload.category;
    if (payload.status !== undefined)
        updateData.status = payload.status;
    if (payload.scheduleText !== undefined)
        updateData.scheduleText = payload.scheduleText;
    if (payload.location !== undefined)
        updateData.location = payload.location;
    if (payload.bannerImage !== undefined)
        updateData.bannerImage = payload.bannerImage;
    if (payload.currentChapter !== undefined)
        updateData.currentChapter = payload.currentChapter;
    if (payload.metadata !== undefined)
        updateData.metadata = (_a = payload.metadata) !== null && _a !== void 0 ? _a : client_1.Prisma.JsonNull;
    if (payload.isActive !== undefined)
        updateData.isActive = payload.isActive;
    if (payload.startDate !== undefined) {
        updateData.startDate = payload.startDate ? new Date(payload.startDate) : null;
    }
    if (payload.endDate !== undefined) {
        updateData.endDate = payload.endDate ? new Date(payload.endDate) : null;
    }
    if (payload.activityId !== undefined) {
        if (payload.activityId === null) {
            updateData.activity = { disconnect: true };
        }
        else {
            updateData.activity = { connect: { id: payload.activityId } };
        }
    }
    return yield db_1.default.event.update({
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
});
const deleteEventFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existingEvent = yield db_1.default.event.findUnique({ where: { id } });
    if (!existingEvent) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event not found!');
    }
    return yield db_1.default.event.delete({ where: { id } });
});
const getCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const records = yield db_1.default.event.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
    });
    return records.map((r) => r.category).filter(Boolean);
});
exports.EventService = {
    createEventIntoDB,
    getAllEventsFromDB,
    getEventByIdOrSlugFromDB,
    updateEventInDB,
    deleteEventFromDB,
    getCategoriesFromDB,
};

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
exports.EventSessionService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const createSessionIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield db_1.default.event.findUnique({
        where: { id: payload.eventId },
    });
    if (!event) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Target event not found!');
    }
    return yield db_1.default.eventSession.create({
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
});
const getSessionsByEventFromDB = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.eventSession.findMany({
        where: { eventId },
        orderBy: { sessionDate: 'asc' },
        include: {
            _count: {
                select: { records: true },
            },
        },
    });
});
const getSessionByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield db_1.default.eventSession.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event session not found!');
    }
    return session;
});
const updateSessionInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield db_1.default.eventSession.findUnique({ where: { id } });
    if (!session) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event session not found!');
    }
    const updateData = {};
    if (payload.sessionDate !== undefined) {
        updateData.sessionDate = new Date(payload.sessionDate);
    }
    if (payload.chapter !== undefined)
        updateData.chapter = payload.chapter;
    if (payload.summary !== undefined)
        updateData.summary = payload.summary;
    if (payload.audioUrl !== undefined)
        updateData.audioUrl = payload.audioUrl;
    if (payload.eventId !== undefined)
        updateData.eventId = payload.eventId;
    return yield db_1.default.eventSession.update({
        where: { id },
        data: updateData,
    });
});
const deleteSessionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield db_1.default.eventSession.findUnique({ where: { id } });
    if (!session) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Event session not found!');
    }
    return yield db_1.default.eventSession.delete({ where: { id } });
});
exports.EventSessionService = {
    createSessionIntoDB,
    getSessionsByEventFromDB,
    getSessionByIdFromDB,
    updateSessionInDB,
    deleteSessionFromDB,
};

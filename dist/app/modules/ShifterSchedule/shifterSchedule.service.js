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
exports.ShifterScheduleService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const createScheduleInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return yield db_1.default.shifterSchedule.create({
        data: {
            shifterId: payload.shifterId,
            dayOfWeek: payload.dayOfWeek,
            dayName: payload.dayName,
            dayEn: payload.dayEn,
            slot: payload.slot,
            slotName: payload.slotName,
            startTime: payload.startTime,
            endTime: payload.endTime,
            isActive: (_a = payload.isActive) !== null && _a !== void 0 ? _a : true,
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
});
const getAllSchedulesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.shifterSchedule.findMany({
        where: {
            isActive: true,
            shifter: {
                role: { in: [client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN] },
                status: client_1.UserStatus.ACTIVE,
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
});
const getTodayScheduleFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const todayDayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
    return yield db_1.default.shifterSchedule.findMany({
        where: {
            isActive: true,
            dayOfWeek: todayDayOfWeek,
            shifter: {
                role: { in: [client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN] },
                status: client_1.UserStatus.ACTIVE,
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
});
const getMyScheduleFromDB = (shifterId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.shifterSchedule.findMany({
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
});
const updateScheduleInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.shifterSchedule.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shifter schedule entry not found!');
    }
    return yield db_1.default.shifterSchedule.update({
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
});
const deleteScheduleInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.shifterSchedule.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shifter schedule entry not found!');
    }
    return yield db_1.default.shifterSchedule.delete({ where: { id } });
});
exports.ShifterScheduleService = {
    createScheduleInDB,
    getAllSchedulesFromDB,
    getTodayScheduleFromDB,
    getMyScheduleFromDB,
    updateScheduleInDB,
    deleteScheduleInDB,
};

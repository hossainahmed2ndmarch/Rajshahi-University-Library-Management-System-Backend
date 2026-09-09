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
exports.ShiftLogService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const notificationSender_1 = require("../../utils/notificationSender");
const resolveRecipients = (currentUserId, targetRecipients) => __awaiter(void 0, void 0, void 0, function* () {
    let whereClause = {
        id: { not: currentUserId },
        status: 'ACTIVE',
    };
    if (!targetRecipients || targetRecipients === 'ALL') {
        whereClause.role = {
            in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER],
        };
    }
    else if (targetRecipients === 'SHIFTER') {
        whereClause.role = client_1.UserRole.SHIFTER;
    }
    else if (targetRecipients === 'ADMIN') {
        whereClause.role = { in: [client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN] };
    }
    else if (targetRecipients === 'SUPER_ADMIN') {
        whereClause.role = client_1.UserRole.SUPER_ADMIN;
    }
    else if (Array.isArray(targetRecipients)) {
        const ids = targetRecipients.map((id) => Number(id)).filter((id) => !isNaN(id));
        if (ids.length > 0) {
            whereClause.id = { in: ids, not: currentUserId };
        }
    }
    const users = yield db_1.default.user.findMany({
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
});
const checkInShiftInDB = (shifterId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const activeShift = yield db_1.default.shiftLog.findFirst({
        where: {
            shifterId,
            status: client_1.ShiftStatus.ACTIVE,
        },
    });
    if (activeShift) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'You already have an active duty shift session!');
    }
    // Check if there is an existing SCHEDULED shift for today that can be activated
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledShift = yield db_1.default.shiftLog.findFirst({
        where: {
            shifterId,
            status: client_1.ShiftStatus.SCHEDULED,
            startTime: {
                gte: today,
                lt: tomorrow,
            },
        },
    });
    if (scheduledShift) {
        return yield db_1.default.shiftLog.update({
            where: { id: scheduledShift.id },
            data: {
                status: client_1.ShiftStatus.ACTIVE,
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
    return yield db_1.default.shiftLog.create({
        data: {
            shifterId,
            startTime: new Date(),
            status: client_1.ShiftStatus.ACTIVE,
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
});
const checkOutShiftInDB = (shifterId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const activeShift = yield db_1.default.shiftLog.findFirst({
        where: {
            shifterId,
            status: client_1.ShiftStatus.ACTIVE,
        },
    });
    if (!activeShift) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No active shift session found for check-out!');
    }
    return yield db_1.default.shiftLog.update({
        where: { id: activeShift.id },
        data: {
            endTime: new Date(),
            status: client_1.ShiftStatus.COMPLETED,
            closingCash: payload.closingCash,
            cashCollected: (_a = payload.cashCollected) !== null && _a !== void 0 ? _a : 0,
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
});
const scheduleShiftInDB = (shifterId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const shifter = yield db_1.default.user.findUnique({
        where: { id: shifterId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    });
    if (!shifter) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shifter user account not found!');
    }
    const startTime = new Date(payload.startTime);
    const endTime = payload.endTime ? new Date(payload.endTime) : undefined;
    const newShift = yield db_1.default.shiftLog.create({
        data: {
            shifterId,
            startTime,
            endTime,
            status: client_1.ShiftStatus.SCHEDULED,
            openingCash: (_a = payload.openingCash) !== null && _a !== void 0 ? _a : 500,
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
    const recipients = yield resolveRecipients(shifterId, payload.notifyRecipients);
    if (recipients.length > 0) {
        (0, notificationSender_1.sendShiftScheduleAlert)({
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
});
const cancelShiftInDB = (shiftId, currentUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const shift = yield db_1.default.shiftLog.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shift session record not found!');
    }
    if (shift.shifterId !== currentUser.userId &&
        currentUser.role !== client_1.UserRole.SUPER_ADMIN &&
        currentUser.role !== client_1.UserRole.ADMIN) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to cancel this duty shift!');
    }
    if (shift.status === client_1.ShiftStatus.COMPLETED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot cancel a completed shift!');
    }
    const updatedNotes = shift.handoverNotes
        ? `${shift.handoverNotes}\n[Cancelled]: ${payload.reason}`
        : `[Cancelled]: ${payload.reason}`;
    const updatedShift = yield db_1.default.shiftLog.update({
        where: { id: shiftId },
        data: {
            status: client_1.ShiftStatus.CANCELLED,
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
    const recipients = yield resolveRecipients(currentUser.userId, payload.notifyRecipients);
    if (recipients.length > 0) {
        (0, notificationSender_1.sendShiftCancellationAlert)({
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
});
const getAllShiftLogsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const shiftLogQuery = new queryBuilder_1.default(db_1.default.shiftLog, query, {
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
    return yield shiftLogQuery.execute();
});
const deleteShiftLogInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const shift = yield db_1.default.shiftLog.findUnique({
        where: { id },
    });
    if (!shift) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Shift log record not found!');
    }
    return yield db_1.default.shiftLog.delete({
        where: { id },
    });
});
exports.ShiftLogService = {
    checkInShiftInDB,
    checkOutShiftInDB,
    scheduleShiftInDB,
    cancelShiftInDB,
    getAllShiftLogsFromDB,
    deleteShiftLogInDB,
};

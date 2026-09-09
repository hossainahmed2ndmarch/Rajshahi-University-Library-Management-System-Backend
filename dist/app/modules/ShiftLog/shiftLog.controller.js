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
exports.ShiftLogController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const shiftLog_service_1 = require("./shiftLog.service");
const checkInShift = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const shifterId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield shiftLog_service_1.ShiftLogService.checkInShiftInDB(shifterId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Shift check-in successful! Duty desk is now ACTIVE.',
        data: result,
    });
}));
const checkOutShift = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const shifterId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield shiftLog_service_1.ShiftLogService.checkOutShiftInDB(shifterId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Shift check-out & cash reconciliation completed successfully!',
        data: result,
    });
}));
const scheduleShift = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const shifterId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield shiftLog_service_1.ShiftLogService.scheduleShiftInDB(shifterId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: `Duty shift scheduled in advance! Notification dispatched to ${result.notifiedCount} staff members.`,
        data: result,
    });
}));
const cancelShift = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const currentUser = {
        userId: Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)),
        role: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
    };
    const shiftId = Number(req.params.id);
    const result = yield shiftLog_service_1.ShiftLogService.cancelShiftInDB(shiftId, currentUser, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Duty shift cancelled. Notification dispatched to ${result.notifiedCount} staff members.`,
        data: result,
    });
}));
const getAllShiftLogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shiftLog_service_1.ShiftLogService.getAllShiftLogsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Shift logs retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const deleteShiftLog = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield shiftLog_service_1.ShiftLogService.deleteShiftLogInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Shift audit log deleted successfully!',
        data: result,
    });
}));
exports.ShiftLogController = {
    checkInShift,
    checkOutShift,
    scheduleShift,
    cancelShift,
    getAllShiftLogs,
    deleteShiftLog,
};

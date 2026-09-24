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
exports.EventMemberRecordController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const eventMemberRecord_service_1 = require("./eventMemberRecord.service");
const bulkMarkAttendance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.bulkMarkAttendanceIntoDB(req.body.records);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `${result.length} attendance records processed successfully!`,
        data: result,
    });
}));
const submitFeedback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.user.userId);
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.submitFeedbackIntoDB(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Feedback submitted successfully and sent for review!',
        data: result,
    });
}));
const selfAttendance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.user.userId);
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.recordSelfAttendanceIntoDB(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message,
        data: result,
    });
}));
const approveFeedback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isApproved } = req.body;
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.approveFeedbackInDB(Number(id), Boolean(isApproved));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: isApproved ? 'Feedback approved successfully!' : 'Feedback rejected/hidden successfully!',
        data: result,
    });
}));
const getRecordsByEvent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.getRecordsByEventFromDB(Number(eventId), req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event attendance records retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getMyRecords = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.user.userId);
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.getMyRecordsFromDB(userId, eventId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'My event records retrieved successfully!',
        data: result,
    });
}));
const getEventStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const result = yield eventMemberRecord_service_1.EventMemberRecordService.getEventAttendanceStatsFromDB(Number(eventId));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Event statistics retrieved successfully!',
        data: result,
    });
}));
exports.EventMemberRecordController = {
    bulkMarkAttendance,
    submitFeedback,
    selfAttendance,
    approveFeedback,
    getRecordsByEvent,
    getMyRecords,
    getEventStats,
};

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
exports.RudcMemberController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const rudcMember_service_1 = require("./rudcMember.service");
const applyForRudc = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield rudcMember_service_1.RudcMemberService.applyForRudc(req.body, requestingUserId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'RUDC Volunteer application submitted successfully!',
        data: result,
    });
}));
const getMyRudcProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield rudcMember_service_1.RudcMemberService.getMyRudcProfile(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'My RUDC Profile retrieved successfully!',
        data: result,
    });
}));
const sendInterviewEmail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcMember_service_1.RudcMemberService.sendInterviewEmail(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Interview notifications processed. (${result.successCount} sent, ${result.failedCount} failed)`,
        data: result,
    });
}));
const getAllRudcMembers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcMember_service_1.RudcMemberService.getAllRudcMembers(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Members retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getRudcMemberById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield rudcMember_service_1.RudcMemberService.getRudcMemberById(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Member details retrieved successfully!',
        data: result,
    });
}));
const updateRudcMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield rudcMember_service_1.RudcMemberService.updateRudcMember(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Member updated successfully!',
        data: result,
    });
}));
const createPreExistedRudcMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcMember_service_1.RudcMemberService.createPreExistedRudcMember(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Pre-existed RUDC Member recorded successfully!',
        data: result,
    });
}));
const getPublicRudcStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcMember_service_1.RudcMemberService.getPublicRudcStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Public RUDC statistics fetched successfully!',
        data: result,
    });
}));
const deleteRudcMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield rudcMember_service_1.RudcMemberService.deleteRudcMember(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message || 'RUDC Member/Applicant deleted successfully!',
        data: result,
    });
}));
exports.RudcMemberController = {
    applyForRudc,
    getMyRudcProfile,
    sendInterviewEmail,
    getAllRudcMembers,
    getRudcMemberById,
    updateRudcMember,
    deleteRudcMember,
    createPreExistedRudcMember,
    getPublicRudcStats,
};

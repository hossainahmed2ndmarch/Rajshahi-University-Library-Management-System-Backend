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
exports.RudcController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const rudc_service_1 = require("./rudc.service");
const applyForRudc = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authUserId = req.user ? Number(req.user.userId) : undefined;
    const result = yield rudc_service_1.RudcService.applyForRudc(req.body, authUserId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'RUDC Volunteer application submitted successfully!',
        data: result,
    });
}));
const getAllRudcMembers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.getAllRudcMembers(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC members retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getRudcMemberById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.getRudcMemberById(Number(req.params.id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC member details retrieved successfully!',
        data: result,
    });
}));
const updateRudcMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.updateRudcMember(Number(req.params.id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC member updated successfully!',
        data: result,
    });
}));
const sendInterviewEmail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.sendInterviewEmail(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Interview invitation sent to ${result.totalSent} applicants!`,
        data: result,
    });
}));
const createPreExistedRudcMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.createPreExistedRudcMember(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'RUDC member entered successfully!',
        data: result,
    });
}));
const getAllRudcTeams = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.getAllRudcTeams();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC teams retrieved successfully!',
        data: result,
    });
}));
const createRudcTeam = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.createRudcTeam(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'RUDC team created successfully!',
        data: result,
    });
}));
const updateRudcTeam = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.updateRudcTeam(Number(req.params.id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC team updated successfully!',
        data: result,
    });
}));
const deleteRudcTeam = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.deleteRudcTeam(Number(req.params.id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC team deleted successfully!',
        data: result,
    });
}));
const assignTeamMembers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.assignTeamMembers(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Members assigned to team successfully!',
        data: result,
    });
}));
const removeTeamMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId, userId } = req.params;
    const result = yield rudc_service_1.RudcService.removeTeamMember(Number(teamId), Number(userId));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Member removed from team successfully!',
        data: result,
    });
}));
const getRudcIyanotRecords = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.getRudcIyanotRecords(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC iyanot records retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const recordIyanotPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const recorderId = req.user ? Number(req.user.userId) : undefined;
    const result = yield rudc_service_1.RudcService.recordIyanotPayment(req.body, recorderId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Iyanot payment recorded successfully!',
        data: result,
    });
}));
const getMyRudcProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.user.userId);
    const result = yield rudc_service_1.RudcService.getMyRudcProfile(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'My RUDC profile retrieved successfully!',
        data: result,
    });
}));
const getPublicRudcStats = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudc_service_1.RudcService.getPublicRudcStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Public RUDC stats retrieved successfully!',
        data: result,
    });
}));
exports.RudcController = {
    applyForRudc,
    getAllRudcMembers,
    getRudcMemberById,
    updateRudcMember,
    sendInterviewEmail,
    createPreExistedRudcMember,
    getAllRudcTeams,
    createRudcTeam,
    updateRudcTeam,
    deleteRudcTeam,
    assignTeamMembers,
    removeTeamMember,
    getRudcIyanotRecords,
    recordIyanotPayment,
    getMyRudcProfile,
    getPublicRudcStats,
};

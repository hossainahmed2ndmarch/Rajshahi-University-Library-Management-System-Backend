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
exports.RudcTeamController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const rudcTeam_service_1 = require("./rudcTeam.service");
const getAllRudcTeams = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcTeam_service_1.RudcTeamService.getAllRudcTeams();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Teams retrieved successfully!',
        data: result,
    });
}));
const createRudcTeam = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcTeam_service_1.RudcTeamService.createRudcTeam(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'RUDC Team created successfully!',
        data: result,
    });
}));
const updateRudcTeam = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield rudcTeam_service_1.RudcTeamService.updateRudcTeam(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Team updated successfully!',
        data: result,
    });
}));
const deleteRudcTeam = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield rudcTeam_service_1.RudcTeamService.deleteRudcTeam(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Team deleted successfully!',
        data: result,
    });
}));
const assignTeamMembers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield rudcTeam_service_1.RudcTeamService.assignTeamMembers(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Members assigned to team successfully!',
        data: result,
    });
}));
const removeTeamMember = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId, userId } = req.params;
    const result = yield rudcTeam_service_1.RudcTeamService.removeTeamMember(Number(teamId), Number(userId));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Member removed from team successfully!',
        data: result,
    });
}));
exports.RudcTeamController = {
    getAllRudcTeams,
    createRudcTeam,
    updateRudcTeam,
    deleteRudcTeam,
    assignTeamMembers,
    removeTeamMember,
};

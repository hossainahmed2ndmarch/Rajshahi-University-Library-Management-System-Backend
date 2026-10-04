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
exports.RudcIyanotController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const rudcIyanot_service_1 = require("./rudcIyanot.service");
const getRudcIyanotRecords = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reqUser = req.user;
    const user = {
        id: Number((reqUser === null || reqUser === void 0 ? void 0 : reqUser.userId) || (reqUser === null || reqUser === void 0 ? void 0 : reqUser.id)),
        role: reqUser === null || reqUser === void 0 ? void 0 : reqUser.role,
    };
    const result = yield rudcIyanot_service_1.RudcIyanotService.getRudcIyanotRecords(req.query, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Iyanot records retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const recordIyanotPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reqUser = req.user;
    const actingUser = {
        id: Number((reqUser === null || reqUser === void 0 ? void 0 : reqUser.userId) || (reqUser === null || reqUser === void 0 ? void 0 : reqUser.id)),
        role: reqUser === null || reqUser === void 0 ? void 0 : reqUser.role,
    };
    const result = yield rudcIyanot_service_1.RudcIyanotService.recordIyanotPayment(req.body, actingUser);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'RUDC Iyanot payment recorded successfully!',
        data: result,
    });
}));
const updateIyanotStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const reqUser = req.user;
    const actingUser = {
        id: Number((reqUser === null || reqUser === void 0 ? void 0 : reqUser.userId) || (reqUser === null || reqUser === void 0 ? void 0 : reqUser.id)),
        role: reqUser === null || reqUser === void 0 ? void 0 : reqUser.role,
    };
    const result = yield rudcIyanot_service_1.RudcIyanotService.updateIyanotStatus(Number(id), req.body, actingUser);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'RUDC Iyanot status updated successfully!',
        data: result,
    });
}));
exports.RudcIyanotController = {
    getRudcIyanotRecords,
    recordIyanotPayment,
    updateIyanotStatus,
};

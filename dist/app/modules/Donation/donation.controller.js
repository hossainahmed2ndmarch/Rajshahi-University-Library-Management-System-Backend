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
exports.DonationController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const donation_service_1 = require("./donation.service");
const createDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const donorId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) ? Number(req.user.userId) : (((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) ? Number(req.user.id) : undefined);
    const result = yield donation_service_1.DonationService.createDonationInDB(req.body, donorId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Donation request submitted successfully!',
        data: result,
    });
}));
const approveDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const adminId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield donation_service_1.DonationService.approveDonationInDB(Number(id), adminId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation received/approved successfully and added to library catalog as borrowable!',
        data: result,
    });
}));
const rejectDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield donation_service_1.DonationService.rejectDonationInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation request rejected.',
        data: result,
    });
}));
const convertDonationToStock = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const adminId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield donation_service_1.DonationService.convertDonationToStock(Number(id), req.body, adminId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation successfully converted into catalog book stock!',
        data: result,
    });
}));
const getAllDonations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user
        ? {
            userId: Number(req.user.userId || req.user.id),
            role: req.user.role,
            email: req.user.email,
        }
        : undefined;
    const result = yield donation_service_1.DonationService.getAllDonationsFromDB(req.query, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donations catalog retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const createPOSDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const shifterId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield donation_service_1.DonationService.createPOSDonationInDB(req.body, shifterId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'POS in-person donation processed successfully!',
        data: result,
    });
}));
const deleteDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield donation_service_1.DonationService.deleteDonationInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation record deleted successfully!',
        data: result,
    });
}));
exports.DonationController = {
    createDonation,
    createPOSDonation,
    approveDonation,
    rejectDonation,
    convertDonationToStock,
    getAllDonations,
    deleteDonation,
};

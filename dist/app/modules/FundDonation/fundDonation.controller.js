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
exports.FundDonationController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const config_1 = __importDefault(require("../../config"));
const fundDonation_service_1 = require("./fundDonation.service");
const client_1 = require("@prisma/client");
const initiateDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) ? Number(((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId) || ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id)) : undefined;
    const result = yield fundDonation_service_1.FundDonationService.initiateOnlineDonation(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation session initiated successfully!',
        data: result,
    });
}));
const handleSuccess = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    const tranId = payload.tran_id;
    try {
        yield fundDonation_service_1.FundDonationService.validatePaymentAndComplete(payload);
    }
    catch (err) {
        console.error('Donation payment success processing error:', err === null || err === void 0 ? void 0 : err.message);
    }
    // Redirect to frontend success receipt page
    return res.redirect(`${config_1.default.client_url}/rudc/donate/success?tran_id=${tranId}`);
}));
const handleFail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    const tranId = payload.tran_id;
    try {
        yield fundDonation_service_1.FundDonationService.handleFailedPayment(payload, client_1.PaymentStatus.FAILED);
    }
    catch (err) {
        console.error('Donation payment fail error:', err === null || err === void 0 ? void 0 : err.message);
    }
    return res.redirect(`${config_1.default.client_url}/rudc/donate/fail?tran_id=${tranId}`);
}));
const handleCancel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    const tranId = payload.tran_id;
    try {
        yield fundDonation_service_1.FundDonationService.handleFailedPayment(payload, client_1.PaymentStatus.CANCELLED);
    }
    catch (err) {
        console.error('Donation payment cancel error:', err === null || err === void 0 ? void 0 : err.message);
    }
    return res.redirect(`${config_1.default.client_url}/rudc/donate/cancel?tran_id=${tranId}`);
}));
const handleIPN = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    let result;
    if (payload.status === 'VALID' || payload.status === 'VALIDATED') {
        result = yield fundDonation_service_1.FundDonationService.validatePaymentAndComplete(payload);
    }
    else {
        result = yield fundDonation_service_1.FundDonationService.handleFailedPayment(payload);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'IPN notification processed successfully!',
        data: result,
    });
}));
const createManualDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const actingUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) ? Number(((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId) || ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id)) : undefined;
    const result = yield fundDonation_service_1.FundDonationService.createManualDonation(req.body, actingUserId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Manual offline donation recorded successfully!',
        data: result,
    });
}));
const getAllDonations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fundDonation_service_1.FundDonationService.getAllDonations(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fund donations retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getDonationById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const result = yield fundDonation_service_1.FundDonationService.getDonationById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation details retrieved successfully!',
        data: result,
    });
}));
const getDonationByReceipt = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const identifier = Array.isArray(req.params.identifier)
        ? req.params.identifier[0]
        : req.params.identifier;
    const result = yield fundDonation_service_1.FundDonationService.getDonationByReceiptOrTranId(identifier);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation receipt retrieved successfully!',
        data: result,
    });
}));
const updateDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const result = yield fundDonation_service_1.FundDonationService.updateDonation(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation updated successfully!',
        data: result,
    });
}));
const deleteDonation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const result = yield fundDonation_service_1.FundDonationService.deleteDonation(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation deleted successfully!',
        data: result,
    });
}));
const getDonationStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fundDonation_service_1.FundDonationService.getDonationStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Donation statistics retrieved successfully!',
        data: result,
    });
}));
const getPublicCampaigns = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fundDonation_service_1.FundDonationService.getPublicCampaigns();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Public fundraiser campaigns retrieved successfully!',
        data: result,
    });
}));
const getPublicRecentDonors = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fundDonation_service_1.FundDonationService.getPublicRecentDonors();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Recent public donors retrieved successfully!',
        data: result,
    });
}));
exports.FundDonationController = {
    initiateDonation,
    handleSuccess,
    handleFail,
    handleCancel,
    handleIPN,
    createManualDonation,
    getAllDonations,
    getDonationById,
    getDonationByReceipt,
    updateDonation,
    deleteDonation,
    getDonationStats,
    getPublicCampaigns,
    getPublicRecentDonors,
};

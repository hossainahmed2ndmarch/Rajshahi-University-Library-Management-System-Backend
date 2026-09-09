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
exports.PaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const payment_service_1 = require("./payment.service");
const initiateMembershipPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield payment_service_1.PaymentService.initiateMembershipPayment(userId, (_c = req.body) === null || _c === void 0 ? void 0 : _c.amount);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment session initiated successfully!',
        data: result,
    });
}));
const handleSuccess = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    const result = yield payment_service_1.PaymentService.validatePaymentAndActivate(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment verified and membership activated successfully!',
        data: result,
    });
}));
const handleFail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    const result = yield payment_service_1.PaymentService.handleFailedPayment(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: false,
        message: 'Payment transaction failed or was rejected.',
        data: result,
    });
}));
const handleCancel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    const result = yield payment_service_1.PaymentService.handleFailedPayment(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: false,
        message: 'Payment transaction was cancelled by user.',
        data: result,
    });
}));
const handleIPN = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = Object.assign(Object.assign({}, req.query), req.body);
    let result;
    if (payload.status === 'VALID' || payload.status === 'VALIDATED') {
        result = yield payment_service_1.PaymentService.validatePaymentAndActivate(payload);
    }
    else {
        result = yield payment_service_1.PaymentService.handleFailedPayment(payload);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'IPN callback processed successfully!',
        data: result,
    });
}));
exports.PaymentController = {
    initiateMembershipPayment,
    handleSuccess,
    handleFail,
    handleCancel,
    handleIPN,
};

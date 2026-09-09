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
exports.PurchaseController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const purchase_service_1 = require("./purchase.service");
const createGuestPurchase = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield purchase_service_1.PurchaseService.createGuestPurchaseInDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Guest purchase completed successfully!',
        data: result,
    });
}));
const createMemberPurchase = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield purchase_service_1.PurchaseService.createMemberPurchaseInDB(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Member purchase completed successfully!',
        data: result,
    });
}));
const getMyPurchases = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    // Always scope to the requesting user's ID regardless of role
    const scopedQuery = Object.assign(Object.assign({}, req.query), { userId: String(userId) });
    const result = yield purchase_service_1.PurchaseService.getAllPurchasesFromDB(scopedQuery, {
        userId,
        role: 'MEMBER', // Force member-style filtering (by userId)
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'My purchase history retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getAllPurchases = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const user = req.user
        ? {
            userId: Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)),
            role: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
        }
        : undefined;
    const result = yield purchase_service_1.PurchaseService.getAllPurchasesFromDB(req.query, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All purchase records retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getGuestOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield purchase_service_1.PurchaseService.getGuestOrdersFromDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Guest purchase orders retrieved successfully!',
        data: result,
    });
}));
const trackGuestOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const transactionId = String(req.params.transactionId || '');
    const email = req.query.email;
    const result = yield purchase_service_1.PurchaseService.trackGuestOrderByTxnIdFromDB(transactionId, email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order tracking details retrieved successfully!',
        data: result,
    });
}));
const cancelGuestPurchase = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield purchase_service_1.PurchaseService.cancelGuestPurchaseInDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Guest purchase cancelled successfully and stock restored!',
        data: result,
    });
}));
const cancelMemberPurchase = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const purchaseId = Number(req.params.id);
    const userId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
    const { reason } = req.body || {};
    const result = yield purchase_service_1.PurchaseService.cancelMemberPurchaseInDB(purchaseId, userId, userRole, reason);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Purchase cancelled successfully and stock restored!',
        data: result,
    });
}));
const updatePurchaseStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const purchaseId = Number(req.params.id);
    const result = yield purchase_service_1.PurchaseService.updatePurchaseStatusInDB(purchaseId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Purchase status updated successfully!',
        data: result,
    });
}));
const createPOSSale = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const shifterId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield purchase_service_1.PurchaseService.createPOSSaleInDB(req.body, shifterId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Counter desk POS sale recorded and completed successfully!',
        data: result,
    });
}));
const deletePurchase = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield purchase_service_1.PurchaseService.deletePurchaseInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Purchase order deleted successfully!',
        data: result,
    });
}));
exports.PurchaseController = {
    createGuestPurchase,
    createMemberPurchase,
    createPOSSale,
    getMyPurchases,
    getAllPurchases,
    getGuestOrders,
    trackGuestOrder,
    cancelGuestPurchase,
    cancelMemberPurchase,
    updatePurchaseStatus,
    deletePurchase,
};

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
exports.OrderController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const order_service_1 = require("./order.service");
const createOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user ? Number(req.user.userId) : undefined;
    const result = yield order_service_1.OrderService.createOrderInDB(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Order placed successfully!',
        data: result,
    });
}));
const getAllOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderService.getAllOrdersFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Orders retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getOrderById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.getOrderByIdFromDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order retrieved successfully!',
        data: result,
    });
}));
const trackOrderByCode = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderCode } = req.params;
    const result = yield order_service_1.OrderService.trackOrderByCodeFromDB(String(orderCode));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order tracking details retrieved successfully!',
        data: result,
    });
}));
const getMyOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.user.userId);
    const result = yield order_service_1.OrderService.getMyOrdersFromDB(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Personal orders retrieved successfully!',
        data: result,
    });
}));
const updateOrderStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.updateOrderStatusInDB(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order status updated successfully!',
        data: result,
    });
}));
const verifyOrderPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.verifyPaymentInDB(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment verification recorded successfully!',
        data: result,
    });
}));
const dispatchCourier = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.dispatchCourierInDB(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Consignment booked with courier & OTP dispatched!',
        data: result,
    });
}));
const verifyDeliveryOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp, orderId, trackingNumber } = req.body;
    const paramId = req.params.id ? Number(req.params.id) : undefined;
    const result = yield order_service_1.OrderService.verifyDeliveryOtpInDB({ orderId: paramId || (orderId ? Number(orderId) : undefined), trackingNumber }, otp);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Delivery OTP confirmed! Parcel marked as DELIVERED.',
        data: result,
    });
}));
const cancelOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.user ? Number(req.user.userId) : undefined;
    const userRole = req.user ? req.user.role : undefined;
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(userRole);
    const result = yield order_service_1.OrderService.cancelOrderInDB(Number(id), userId, isStaff);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order cancelled and stock inventory restored!',
        data: result,
    });
}));
const deleteOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield order_service_1.OrderService.deleteOrderInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order record deleted successfully!',
        data: null,
    });
}));
exports.OrderController = {
    createOrder,
    getAllOrders,
    getOrderById,
    trackOrderByCode,
    getMyOrders,
    updateOrderStatus,
    verifyOrderPayment,
    dispatchCourier,
    verifyDeliveryOtp,
    cancelOrder,
    deleteOrder,
};

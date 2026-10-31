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
exports.PurchaseService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const order_service_1 = require("../Order/order.service");
exports.PurchaseService = {
    createGuestPurchaseInDB: (_payload) => __awaiter(void 0, void 0, void 0, function* () {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Guest checkout is no longer supported. Please register or sign in to complete your purchase.');
    }),
    createMemberPurchaseInDB: order_service_1.OrderService.createOrderInDB,
    getAllPurchasesFromDB: order_service_1.OrderService.getAllOrdersFromDB,
    getPurchaseByIdFromDB: order_service_1.OrderService.getOrderByIdFromDB,
    getMyPurchasesFromDB: order_service_1.OrderService.getMyOrdersFromDB,
    updateOrderStatusInDB: order_service_1.OrderService.updateOrderStatusInDB,
    verifyPaymentInDB: order_service_1.OrderService.verifyPaymentInDB,
    dispatchCourierInDB: order_service_1.OrderService.dispatchCourierInDB,
    verifyDeliveryOtpInDB: order_service_1.OrderService.verifyDeliveryOtpInDB,
    cancelPurchaseInDB: order_service_1.OrderService.cancelOrderInDB,
    deletePurchaseFromDB: order_service_1.OrderService.deleteOrderInDB,
    trackOrderByCodeFromDB: order_service_1.OrderService.trackOrderByCodeFromDB,
};

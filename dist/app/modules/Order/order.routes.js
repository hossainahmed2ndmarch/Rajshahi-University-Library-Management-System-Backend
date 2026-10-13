"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const order_controller_1 = require("./order.controller");
const order_validation_1 = require("./order.validation");
const router = (0, express_1.Router)();
// 1. Create order (Public / Authenticated guests & patrons)
router.post('/', (0, validateRequest_1.default)(order_validation_1.OrderValidation.createOrderValidationSchema), order_controller_1.OrderController.createOrder);
// 2. Track order by orderCode or trackingNumber (Public)
router.get('/track/:orderCode', order_controller_1.OrderController.trackOrderByCode);
// 3. Public Courier Delivery OTP Verification
// (Courier rider scans QR or visits /delivery/verify with tracking code + customer's OTP)
router.post('/verify-delivery-otp', (0, validateRequest_1.default)(order_validation_1.OrderValidation.verifyDeliveryOtpValidationSchema), order_controller_1.OrderController.verifyDeliveryOtp);
// 4. Authenticated: Patron personal orders
router.get('/my-orders', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), order_controller_1.OrderController.getMyOrders);
// 5. Staff: List all normalized orders
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), order_controller_1.OrderController.getAllOrders);
// 6. Staff: Get single order by id
router.get('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), order_controller_1.OrderController.getOrderById);
// 7. Staff: Update order status
router.patch('/:id/status', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(order_validation_1.OrderValidation.updateOrderStatusValidationSchema), order_controller_1.OrderController.updateOrderStatus);
// 8. Staff: Verify manual MFS payment
router.patch('/:id/verify-payment', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(order_validation_1.OrderValidation.verifyOrderPaymentValidationSchema), order_controller_1.OrderController.verifyOrderPayment);
// 9. Staff: Dispatch parcel via Steadfast Courier & send OTP
router.post('/:id/dispatch-courier', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), order_controller_1.OrderController.dispatchCourier);
// 10. Staff: Verify Delivery OTP by order ID
router.post('/:id/verify-otp', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(order_validation_1.OrderValidation.verifyDeliveryOtpValidationSchema), order_controller_1.OrderController.verifyDeliveryOtp);
// 11. Customer or Staff: Cancel order
router.patch('/:id/cancel', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), order_controller_1.OrderController.cancelOrder);
// 12. Admin: Delete order record
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), order_controller_1.OrderController.deleteOrder);
exports.OrderRoutes = router;

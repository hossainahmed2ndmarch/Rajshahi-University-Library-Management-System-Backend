"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const purchase_controller_1 = require("./purchase.controller");
const purchase_validation_1 = require("./purchase.validation");
const router = (0, express_1.Router)();
// Guest Endpoints
router.post('/guest', (0, validateRequest_1.default)(purchase_validation_1.PurchaseValidation.guestPurchaseValidationSchema), purchase_controller_1.PurchaseController.createGuestPurchase);
router.post('/guest/orders', (0, validateRequest_1.default)(purchase_validation_1.PurchaseValidation.guestOrdersLookupValidationSchema), purchase_controller_1.PurchaseController.getGuestOrders);
router.get('/guest/track/:transactionId', purchase_controller_1.PurchaseController.trackGuestOrder);
router.post('/guest/cancel', (0, validateRequest_1.default)(purchase_validation_1.PurchaseValidation.guestCancelOrderValidationSchema), purchase_controller_1.PurchaseController.cancelGuestPurchase);
// Member / Authenticated Purchase Endpoints
router.post('/', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(purchase_validation_1.PurchaseValidation.memberPurchaseValidationSchema), purchase_controller_1.PurchaseController.createMemberPurchase);
router.post('/member', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(purchase_validation_1.PurchaseValidation.memberPurchaseValidationSchema), purchase_controller_1.PurchaseController.createMemberPurchase);
router.get('/my-purchases', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), purchase_controller_1.PurchaseController.getMyPurchases);
router.patch('/:id/cancel', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), purchase_controller_1.PurchaseController.cancelMemberPurchase);
// POS Desk In-Person Book Sales (Staff)
router.post('/pos', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(purchase_validation_1.PurchaseValidation.posSaleValidationSchema), purchase_controller_1.PurchaseController.createPOSSale);
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), purchase_controller_1.PurchaseController.getAllPurchases);
router.patch('/:id/status', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), purchase_controller_1.PurchaseController.updatePurchaseStatus);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), purchase_controller_1.PurchaseController.deletePurchase);
exports.PurchaseRoutes = router;

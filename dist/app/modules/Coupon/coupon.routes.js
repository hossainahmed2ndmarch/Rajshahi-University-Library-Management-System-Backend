"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const coupon_controller_1 = require("./coupon.controller");
const coupon_validation_1 = require("./coupon.validation");
const router = (0, express_1.Router)();
// Public / Authenticated validation of coupon code
router.post('/validate', (0, validateRequest_1.default)(coupon_validation_1.CouponValidation.validateCouponValidationSchema), coupon_controller_1.CouponController.validateCoupon);
// Admin-only CRUD operations
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(coupon_validation_1.CouponValidation.createCouponValidationSchema), coupon_controller_1.CouponController.createCoupon);
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), coupon_controller_1.CouponController.getAllCoupons);
router.get('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), coupon_controller_1.CouponController.getCouponById);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(coupon_validation_1.CouponValidation.updateCouponValidationSchema), coupon_controller_1.CouponController.updateCoupon);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), coupon_controller_1.CouponController.deleteCoupon);
exports.CouponRoutes = router;

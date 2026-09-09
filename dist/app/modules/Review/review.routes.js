"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importStar(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const review_controller_1 = require("./review.controller");
const review_validation_1 = require("./review.validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.optionalAuth, (0, validateRequest_1.default)(review_validation_1.ReviewValidation.createBookReviewValidationSchema), review_controller_1.ReviewController.createBookReview);
router.post('/book', auth_1.optionalAuth, (0, validateRequest_1.default)(review_validation_1.ReviewValidation.createBookReviewValidationSchema), review_controller_1.ReviewController.createBookReview);
router.post('/service', auth_1.optionalAuth, (0, validateRequest_1.default)(review_validation_1.ReviewValidation.createServiceReviewValidationSchema), review_controller_1.ReviewController.createServiceReview);
router.get('/service', review_controller_1.ReviewController.getServiceReviews);
router.get('/book/:bookId', review_controller_1.ReviewController.getBookReviews);
router.get('/all', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), review_controller_1.ReviewController.getAllReviews);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), review_controller_1.ReviewController.updateReview);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), review_controller_1.ReviewController.deleteReview);
exports.ReviewRoutes = router;

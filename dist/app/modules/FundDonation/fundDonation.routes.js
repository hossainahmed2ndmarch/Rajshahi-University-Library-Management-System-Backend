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
exports.FundDonationRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importStar(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const fundDonation_controller_1 = require("./fundDonation.controller");
const fundDonation_validation_1 = require("./fundDonation.validation");
const router = (0, express_1.Router)();
// --- Public Endpoints ---
router.post('/initiate', auth_1.optionalAuth, (0, validateRequest_1.default)(fundDonation_validation_1.FundDonationValidation.initiateDonationValidationSchema), fundDonation_controller_1.FundDonationController.initiateDonation);
router.get('/campaigns', fundDonation_controller_1.FundDonationController.getPublicCampaigns);
router.get('/donors', fundDonation_controller_1.FundDonationController.getPublicRecentDonors);
router.get('/receipt/:identifier', fundDonation_controller_1.FundDonationController.getDonationByReceipt);
// --- Payment Gateway Callbacks (Public) ---
router.post('/success', fundDonation_controller_1.FundDonationController.handleSuccess);
router.get('/success', fundDonation_controller_1.FundDonationController.handleSuccess);
router.post('/fail', fundDonation_controller_1.FundDonationController.handleFail);
router.get('/fail', fundDonation_controller_1.FundDonationController.handleFail);
router.post('/cancel', fundDonation_controller_1.FundDonationController.handleCancel);
router.get('/cancel', fundDonation_controller_1.FundDonationController.handleCancel);
router.post('/ipn', fundDonation_controller_1.FundDonationController.handleIPN);
// --- Admin & Super Admin Protected Endpoints ---
router.get('/stats', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), fundDonation_controller_1.FundDonationController.getDonationStats);
router.get('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), fundDonation_controller_1.FundDonationController.getAllDonations);
router.post('/manual', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(fundDonation_validation_1.FundDonationValidation.createManualDonationValidationSchema), fundDonation_controller_1.FundDonationController.createManualDonation);
router.get('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), fundDonation_controller_1.FundDonationController.getDonationById);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(fundDonation_validation_1.FundDonationValidation.updateDonationValidationSchema), fundDonation_controller_1.FundDonationController.updateDonation);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), fundDonation_controller_1.FundDonationController.deleteDonation);
exports.FundDonationRoutes = router;

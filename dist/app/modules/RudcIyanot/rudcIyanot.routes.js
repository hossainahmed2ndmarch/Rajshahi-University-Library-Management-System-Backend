"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcIyanotRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rudcIyanot_controller_1 = require("./rudcIyanot.controller");
const rudcIyanot_validation_1 = require("./rudcIyanot.validation");
const router = (0, express_1.Router)();
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), rudcIyanot_controller_1.RudcIyanotController.getRudcIyanotRecords);
router.post('/record', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), (0, validateRequest_1.default)(rudcIyanot_validation_1.RudcIyanotValidation.recordIyanotZodSchema), rudcIyanot_controller_1.RudcIyanotController.recordIyanotPayment);
exports.RudcIyanotRoutes = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcMemberRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rudcMember_controller_1 = require("./rudcMember.controller");
const rudcMember_validation_1 = require("./rudcMember.validation");
const router = (0, express_1.Router)();
// Public Volunteer Application (Registration)
router.post('/apply', (0, validateRequest_1.default)(rudcMember_validation_1.RudcMemberValidation.applyRudcZodSchema), rudcMember_controller_1.RudcMemberController.applyForRudc);
// Public Stats for landing page
router.get('/stats', rudcMember_controller_1.RudcMemberController.getPublicRudcStats);
// Logged-in Volunteer / Member profile
router.get('/my-profile', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), rudcMember_controller_1.RudcMemberController.getMyRudcProfile);
// Interview Notification Email
router.post('/send-interview-email', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(rudcMember_validation_1.RudcMemberValidation.sendInterviewEmailZodSchema), rudcMember_controller_1.RudcMemberController.sendInterviewEmail);
// Pre-existed RUDC Member Entry
router.post('/pre-existed', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(rudcMember_validation_1.RudcMemberValidation.createPreExistedRudcMemberZodSchema), rudcMember_controller_1.RudcMemberController.createPreExistedRudcMember);
// Member Management
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), rudcMember_controller_1.RudcMemberController.getAllRudcMembers);
router.get('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), rudcMember_controller_1.RudcMemberController.getRudcMemberById);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(rudcMember_validation_1.RudcMemberValidation.updateRudcMemberZodSchema), rudcMember_controller_1.RudcMemberController.updateRudcMember);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), rudcMember_controller_1.RudcMemberController.deleteRudcMember);
exports.RudcMemberRoutes = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcTeamRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rudcTeam_controller_1 = require("./rudcTeam.controller");
const rudcTeam_validation_1 = require("./rudcTeam.validation");
const router = (0, express_1.Router)();
// List teams: accessible to authenticated users
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), rudcTeam_controller_1.RudcTeamController.getAllRudcTeams);
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(rudcTeam_validation_1.RudcTeamValidation.rudcTeamZodSchema), rudcTeam_controller_1.RudcTeamController.createRudcTeam);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), rudcTeam_controller_1.RudcTeamController.updateRudcTeam);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), rudcTeam_controller_1.RudcTeamController.deleteRudcTeam);
router.post('/assign', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(rudcTeam_validation_1.RudcTeamValidation.assignTeamMembersZodSchema), rudcTeam_controller_1.RudcTeamController.assignTeamMembers);
router.delete('/:teamId/members/:userId', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), rudcTeam_controller_1.RudcTeamController.removeTeamMember);
exports.RudcTeamRoutes = router;

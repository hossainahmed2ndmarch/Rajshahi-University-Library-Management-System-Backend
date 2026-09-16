"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShifterScheduleRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const shifterSchedule_controller_1 = require("./shifterSchedule.controller");
const shifterSchedule_validation_1 = require("./shifterSchedule.validation");
const router = (0, express_1.Router)();
// 1. Public — for home page, contact page, weekly roster modal
router.get('/', shifterSchedule_controller_1.ShifterScheduleController.getAllSchedules);
router.get('/today', shifterSchedule_controller_1.ShifterScheduleController.getTodaySchedule);
// 2. Authenticated — own schedule
router.get('/my', (0, auth_1.default)(client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), shifterSchedule_controller_1.ShifterScheduleController.getMySchedule);
router.get('/my-schedule', (0, auth_1.default)(client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), shifterSchedule_controller_1.ShifterScheduleController.getMySchedule);
// 3. Admin / Super Admin — create schedule assignment
router.post('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(shifterSchedule_validation_1.ShifterScheduleValidation.createScheduleSchema), shifterSchedule_controller_1.ShifterScheduleController.createSchedule);
// 4. Admin / Super Admin / Shifter — update own slot
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(shifterSchedule_validation_1.ShifterScheduleValidation.updateScheduleSchema), shifterSchedule_controller_1.ShifterScheduleController.updateSchedule);
// 5. Admin / Super Admin — delete slot
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), shifterSchedule_controller_1.ShifterScheduleController.deleteSchedule);
exports.ShifterScheduleRoutes = router;

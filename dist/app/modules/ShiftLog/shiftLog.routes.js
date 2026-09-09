"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftLogRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const shiftLog_controller_1 = require("./shiftLog.controller");
const shiftLog_validation_1 = require("./shiftLog.validation");
const router = (0, express_1.Router)();
// 1. Check in / start duty shift (status: ACTIVE)
router.post('/check-in', (0, auth_1.default)(client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(shiftLog_validation_1.ShiftLogValidation.checkInValidationSchema), shiftLog_controller_1.ShiftLogController.checkInShift);
// 2. Check out / end duty shift (status: COMPLETED)
router.post('/check-out', (0, auth_1.default)(client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(shiftLog_validation_1.ShiftLogValidation.checkOutValidationSchema), shiftLog_controller_1.ShiftLogController.checkOutShift);
// 3. Schedule duty shift in advance & notify staff
router.post('/schedule', (0, auth_1.default)(client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(shiftLog_validation_1.ShiftLogValidation.scheduleShiftValidationSchema), shiftLog_controller_1.ShiftLogController.scheduleShift);
// 4. Cancel scheduled duty shift in advance & notify staff
router.patch('/cancel/:id', (0, auth_1.default)(client_1.UserRole.SHIFTER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(shiftLog_validation_1.ShiftLogValidation.cancelShiftValidationSchema), shiftLog_controller_1.ShiftLogController.cancelShift);
// 5. Get all shift audit records
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), shiftLog_controller_1.ShiftLogController.getAllShiftLogs);
// 6. Delete shift audit log after audit (Admin / Super Admin)
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), shiftLog_controller_1.ShiftLogController.deleteShiftLog);
exports.ShiftLogRoutes = router;

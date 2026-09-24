"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const activity_controller_1 = require("./activity.controller");
const activity_validation_1 = require("./activity.validation");
const router = (0, express_1.Router)();
// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', activity_controller_1.ActivityController.getAllActivities);
router.get('/:idOrSlug', activity_controller_1.ActivityController.getActivityById);
// ── Admin + Super Admin Routes ────────────────────────────────────────────────
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(activity_validation_1.ActivityValidation.createActivityValidationSchema), activity_controller_1.ActivityController.createActivity);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(activity_validation_1.ActivityValidation.updateActivityValidationSchema), activity_controller_1.ActivityController.updateActivity);
// ── Super Admin Only ──────────────────────────────────────────────────────────
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN), activity_controller_1.ActivityController.deleteActivity);
exports.ActivityRoutes = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const event_controller_1 = require("./event.controller");
const event_validation_1 = require("./event.validation");
const router = (0, express_1.Router)();
// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', event_controller_1.EventController.getAllEvents);
router.get('/:idOrSlug', event_controller_1.EventController.getEventByIdOrSlug);
// ── Admin + Super Admin Routes ────────────────────────────────────────────────
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(event_validation_1.EventValidation.createEventValidationSchema), event_controller_1.EventController.createEvent);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(event_validation_1.EventValidation.updateEventValidationSchema), event_controller_1.EventController.updateEvent);
// ── Super Admin Only ──────────────────────────────────────────────────────────
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN), event_controller_1.EventController.deleteEvent);
exports.EventRoutes = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSessionRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const eventSession_controller_1 = require("./eventSession.controller");
const eventSession_validation_1 = require("./eventSession.validation");
const router = (0, express_1.Router)();
// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', eventSession_controller_1.EventSessionController.getSessionsByEvent);
router.get('/event/:eventId', eventSession_controller_1.EventSessionController.getSessionsByEvent);
router.get('/:id', eventSession_controller_1.EventSessionController.getSessionById);
// ── Admin + Super Admin Routes ────────────────────────────────────────────────
router.post('/upload-audio', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), uploadImage_1.uploadSessionAudio, eventSession_controller_1.EventSessionController.uploadAudio);
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(eventSession_validation_1.EventSessionValidation.createEventSessionValidationSchema), eventSession_controller_1.EventSessionController.createSession);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(eventSession_validation_1.EventSessionValidation.updateEventSessionValidationSchema), eventSession_controller_1.EventSessionController.updateSession);
// ── Super Admin Only ──────────────────────────────────────────────────────────
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN), eventSession_controller_1.EventSessionController.deleteSession);
exports.EventSessionRoutes = router;

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
exports.EventMemberRecordRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importStar(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const eventMemberRecord_controller_1 = require("./eventMemberRecord.controller");
const eventMemberRecord_validation_1 = require("./eventMemberRecord.validation");
const router = (0, express_1.Router)();
// ── Public & Guest Routes ──────────────────────────────────────────────────
router.get('/stats/:eventId', auth_1.optionalAuth, eventMemberRecord_controller_1.EventMemberRecordController.getEventStats);
router.post('/campaign', auth_1.optionalAuth, (0, validateRequest_1.default)(eventMemberRecord_validation_1.EventMemberRecordValidation.campaignSubmissionValidationSchema), eventMemberRecord_controller_1.EventMemberRecordController.submitCampaign);
// ── Authenticated User Routes ─────────────────────────────────────────────────
router.get('/my-records', (0, auth_1.default)(), eventMemberRecord_controller_1.EventMemberRecordController.getMyRecords);
router.post('/self-attendance', (0, auth_1.default)(), (0, validateRequest_1.default)(eventMemberRecord_validation_1.EventMemberRecordValidation.selfAttendanceValidationSchema), eventMemberRecord_controller_1.EventMemberRecordController.selfAttendance);
router.post('/feedback', (0, auth_1.default)(), (0, validateRequest_1.default)(eventMemberRecord_validation_1.EventMemberRecordValidation.submitFeedbackValidationSchema), eventMemberRecord_controller_1.EventMemberRecordController.submitFeedback);
// ── Admin & Super Admin Management Routes ────────────────────────────────────
router.get('/event/:eventId', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), eventMemberRecord_controller_1.EventMemberRecordController.getRecordsByEvent);
router.post('/bulk-attendance', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(eventMemberRecord_validation_1.EventMemberRecordValidation.bulkAttendanceValidationSchema), eventMemberRecord_controller_1.EventMemberRecordController.bulkMarkAttendance);
router.patch('/approve/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(eventMemberRecord_validation_1.EventMemberRecordValidation.approveFeedbackValidationSchema), eventMemberRecord_controller_1.EventMemberRecordController.approveFeedback);
router.post('/publish-article/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(eventMemberRecord_validation_1.EventMemberRecordValidation.publishRecordAsArticleValidationSchema), eventMemberRecord_controller_1.EventMemberRecordController.publishRecordAsArticle);
exports.EventMemberRecordRoutes = router;

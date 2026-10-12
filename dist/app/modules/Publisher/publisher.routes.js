"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const publisher_controller_1 = require("./publisher.controller");
const publisher_validation_1 = require("./publisher.validation");
const router = (0, express_1.Router)();
// Public Read
router.get('/', publisher_controller_1.PublisherController.getAllPublishers);
router.get('/:id', publisher_controller_1.PublisherController.getPublisherById);
// Upload Logo
router.post('/upload-logo', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), uploadImage_1.uploadPublisherLogo, publisher_controller_1.PublisherController.uploadLogo);
// Staff Management (Shifter, Admin, Super Admin)
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(publisher_validation_1.PublisherValidation.createPublisherValidationSchema), publisher_controller_1.PublisherController.createPublisher);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(publisher_validation_1.PublisherValidation.updatePublisherValidationSchema), publisher_controller_1.PublisherController.updatePublisher);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), publisher_controller_1.PublisherController.deletePublisher);
exports.PublisherRoutes = router;

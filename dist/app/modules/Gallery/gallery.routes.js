"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const gallery_controller_1 = require("./gallery.controller");
const gallery_validation_1 = require("./gallery.validation");
const router = (0, express_1.Router)();
// ── Public Routes ────────────────────────────────────────────────────────────
router.get('/', gallery_controller_1.GalleryController.getAllGalleryItems);
router.get('/assets', gallery_controller_1.GalleryController.getAllAssets);
router.get('/asset/:key', gallery_controller_1.GalleryController.getAssetByKey);
router.get('/categories', gallery_controller_1.GalleryController.getCategories);
router.get('/:id', gallery_controller_1.GalleryController.getGalleryItemById);
// ── Admin & Super Admin Routes ───────────────────────────────────────────────
router.post('/upload', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), uploadImage_1.uploadGalleryMedia, gallery_controller_1.GalleryController.uploadMedia);
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(gallery_validation_1.GalleryValidation.createGalleryItemValidationSchema), gallery_controller_1.GalleryController.createGalleryItem);
router.put('/asset/:key', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(gallery_validation_1.GalleryValidation.setAssetValidationSchema), gallery_controller_1.GalleryController.upsertAsset);
router.delete('/asset/:key', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), gallery_controller_1.GalleryController.deleteAssetByKey);
router.patch('/:id/toggle-publish', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), gallery_controller_1.GalleryController.togglePublish);
router.patch('/:id/toggle-feature', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), gallery_controller_1.GalleryController.toggleFeature);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(gallery_validation_1.GalleryValidation.updateGalleryItemValidationSchema), gallery_controller_1.GalleryController.updateGalleryItem);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), gallery_controller_1.GalleryController.deleteGalleryItem);
exports.GalleryRoutes = router;

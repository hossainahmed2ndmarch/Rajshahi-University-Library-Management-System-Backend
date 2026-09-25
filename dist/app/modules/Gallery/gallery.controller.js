"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const gallery_service_1 = require("./gallery.service");
const createGalleryItem = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield gallery_service_1.GalleryService.createGalleryItemIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Gallery item created successfully!',
        data: result,
    });
}));
const getAllGalleryItems = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield gallery_service_1.GalleryService.getAllGalleryItemsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Gallery items retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getGalleryItemById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield gallery_service_1.GalleryService.getGalleryItemByIdFromDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Gallery item retrieved successfully!',
        data: result,
    });
}));
const updateGalleryItem = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield gallery_service_1.GalleryService.updateGalleryItemInDB(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Gallery item updated successfully!',
        data: result,
    });
}));
const deleteGalleryItem = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield gallery_service_1.GalleryService.deleteGalleryItemFromDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Gallery item deleted successfully!',
        data: result,
    });
}));
const togglePublish = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield gallery_service_1.GalleryService.togglePublishInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Gallery item ${result.isPublished ? 'published' : 'unpublished'} successfully!`,
        data: result,
    });
}));
const toggleFeature = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield gallery_service_1.GalleryService.toggleFeatureInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Gallery item ${result.featured ? 'marked as featured' : 'unmarked from featured'} successfully!`,
        data: result,
    });
}));
const uploadMedia = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    if (!file) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Please select a media file to upload!',
            data: null,
        });
    }
    const mediaUrl = (file.path || file.secure_url || file.url);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Media uploaded successfully!',
        data: { url: mediaUrl },
    });
}));
// ── Asset Specific Controllers ──────────────────────────────────────────────
const getAssetByKey = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = req.params.key;
    const result = yield gallery_service_1.GalleryService.getAssetByKeyFromDB(key);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Asset "${key}" retrieved successfully!`,
        data: result,
    });
}));
const getAllAssets = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { org } = req.query;
    const result = yield gallery_service_1.GalleryService.getAllAssetsFromDB(org);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Site assets retrieved successfully!',
        data: result,
    });
}));
const upsertAsset = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = req.params.key;
    const payload = Object.assign(Object.assign({}, req.body), { assetKey: key || req.body.assetKey });
    const result = yield gallery_service_1.GalleryService.upsertAssetInDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Site asset "${payload.assetKey}" saved successfully!`,
        data: result,
    });
}));
const deleteAssetByKey = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = req.params.key;
    const result = yield gallery_service_1.GalleryService.deleteAssetByKeyFromDB(key);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Site asset "${key}" deleted successfully!`,
        data: result,
    });
}));
const getCategories = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { org } = req.query;
    const categories = yield gallery_service_1.GalleryService.getCategoriesFromDB(org);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Gallery categories retrieved successfully!',
        data: categories,
    });
}));
exports.GalleryController = {
    createGalleryItem,
    getAllGalleryItems,
    getGalleryItemById,
    updateGalleryItem,
    deleteGalleryItem,
    deleteAssetByKey,
    togglePublish,
    toggleFeature,
    uploadMedia,
    getAssetByKey,
    getAllAssets,
    upsertAsset,
    getCategories,
};

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
exports.ArticleController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const article_service_1 = require("./article.service");
const createArticle = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestingUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)
        ? Number(req.user.userId || req.user.id)
        : undefined;
    const result = yield article_service_1.ArticleService.createArticleIntoDB(req.body, requestingUserId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Article published/created successfully!',
        data: result,
    });
}));
const getAllArticles = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // If request is from unauthenticated user or member, only show published articles by default
    const query = Object.assign({}, req.query);
    const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    const isStaff = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'SHIFTER';
    if (!isStaff) {
        query.isPublished = 'true';
    }
    const result = yield article_service_1.ArticleService.getAllArticlesFromDB(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Articles retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getArticleByIdOrSlug = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const idOrSlug = String(req.params.idOrSlug);
    const result = yield article_service_1.ArticleService.getArticleByIdOrSlugFromDB(idOrSlug, true);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Article details retrieved successfully!',
        data: result,
    });
}));
const updateArticle = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const result = yield article_service_1.ArticleService.updateArticleInDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Article updated successfully!',
        data: result,
    });
}));
const deleteArticle = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const result = yield article_service_1.ArticleService.deleteArticleFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Article deleted successfully!',
        data: result,
    });
}));
const getArticleCategories = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield article_service_1.ArticleService.getArticleCategoriesFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Article categories retrieved successfully!',
        data: result,
    });
}));
const uploadArticleCover = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const file = req.file;
    if (!file) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Please select an image file to upload!',
            data: null,
        });
    }
    const coverImageUrl = (file.path || file.secure_url || file.url);
    if (!coverImageUrl) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to retrieve uploaded image URL from Cloudinary.',
            data: null,
        });
    }
    const articleId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.articleId) ? Number(req.body.articleId) : undefined;
    if (articleId) {
        yield article_service_1.ArticleService.updateArticleInDB(articleId, { coverImage: coverImageUrl });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Article cover image uploaded to Cloudinary successfully!',
        data: { url: coverImageUrl },
    });
}));
exports.ArticleController = {
    createArticle,
    getAllArticles,
    getArticleByIdOrSlug,
    updateArticle,
    deleteArticle,
    getArticleCategories,
    uploadArticleCover,
};

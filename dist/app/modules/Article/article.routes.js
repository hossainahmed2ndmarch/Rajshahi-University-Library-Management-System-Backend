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
exports.ArticleRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importStar(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const article_controller_1 = require("./article.controller");
const article_validation_1 = require("./article.validation");
const router = (0, express_1.Router)();
// ── Upload article cover image ──────────────────────────────────────────────
router.post('/upload-cover', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), uploadImage_1.uploadArticleCover, article_controller_1.ArticleController.uploadArticleCover);
// ── Create new article ───────────────────────────────────────────────────────
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(article_validation_1.ArticleValidation.createArticleValidationSchema), article_controller_1.ArticleController.createArticle);
// ── Get all articles (with optional auth, filtering, search, pagination) ────
router.get('/', auth_1.optionalAuth, article_controller_1.ArticleController.getAllArticles);
// ── Public: Get article categories ──────────────────────────────────────────
router.get('/categories', article_controller_1.ArticleController.getArticleCategories);
// ── Public: Get single article by ID or slug ────────────────────────────────
router.get('/:idOrSlug', article_controller_1.ArticleController.getArticleByIdOrSlug);
// ── Update article ──────────────────────────────────────────────────────────
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(article_validation_1.ArticleValidation.updateArticleValidationSchema), article_controller_1.ArticleController.updateArticle);
// ── Delete article ──────────────────────────────────────────────────────────
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), article_controller_1.ArticleController.deleteArticle);
exports.ArticleRoutes = router;

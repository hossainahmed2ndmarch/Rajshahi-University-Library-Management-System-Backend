"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const article_controller_1 = require("./article.controller");
const article_validation_1 = require("./article.validation");
const router = (0, express_1.Router)();
// ── Upload article cover image ──────────────────────────────────────────────
router.post('/upload-cover', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), uploadImage_1.uploadArticleCover, article_controller_1.ArticleController.uploadArticleCover);
// ── Create new article ───────────────────────────────────────────────────────
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(article_validation_1.ArticleValidation.createArticleValidationSchema), article_controller_1.ArticleController.createArticle);
// ── Public: Get all articles (with filtering, search, pagination) ─────────────
router.get('/', article_controller_1.ArticleController.getAllArticles);
// ── Public: Get article categories ──────────────────────────────────────────
router.get('/categories', article_controller_1.ArticleController.getArticleCategories);
// ── Public: Get single article by ID or slug ────────────────────────────────
router.get('/:idOrSlug', article_controller_1.ArticleController.getArticleByIdOrSlug);
// ── Update article ──────────────────────────────────────────────────────────
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), (0, validateRequest_1.default)(article_validation_1.ArticleValidation.updateArticleValidationSchema), article_controller_1.ArticleController.updateArticle);
// ── Delete article ──────────────────────────────────────────────────────────
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), article_controller_1.ArticleController.deleteArticle);
exports.ArticleRoutes = router;

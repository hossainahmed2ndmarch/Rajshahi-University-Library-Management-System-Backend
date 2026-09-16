import { Router } from 'express';
import { UserRole } from '@prisma/client';
import auth, { optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadArticleCover } from '../../middlewares/uploadImage';
import { ArticleController } from './article.controller';
import { ArticleValidation } from './article.validation';

const router = Router();

// ── Upload article cover image ──────────────────────────────────────────────
router.post(
  '/upload-cover',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  uploadArticleCover,
  ArticleController.uploadArticleCover
);

// ── Create new article ───────────────────────────────────────────────────────
router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(ArticleValidation.createArticleValidationSchema),
  ArticleController.createArticle
);

// ── Get all articles (with optional auth, filtering, search, pagination) ────
router.get('/', optionalAuth, ArticleController.getAllArticles);

// ── Public: Get article categories ──────────────────────────────────────────
router.get('/categories', ArticleController.getArticleCategories);

// ── Public: Get single article by ID or slug ────────────────────────────────
router.get('/:idOrSlug', ArticleController.getArticleByIdOrSlug);

// ── Update article ──────────────────────────────────────────────────────────
router.patch(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(ArticleValidation.updateArticleValidationSchema),
  ArticleController.updateArticle
);

// ── Delete article ──────────────────────────────────────────────────────────
router.delete(
  '/:id',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ArticleController.deleteArticle
);

export const ArticleRoutes = router;

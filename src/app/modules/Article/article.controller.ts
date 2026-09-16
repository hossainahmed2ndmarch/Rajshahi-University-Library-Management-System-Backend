import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ArticleService } from './article.service';

const createArticle = catchAsync(async (req: Request, res: Response) => {
  const requestingUserId =
    req.user?.userId || req.user?.id
      ? Number(req.user.userId || req.user.id)
      : undefined;
  const result = await ArticleService.createArticleIntoDB(req.body, requestingUserId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Article published/created successfully!',
    data: result,
  });
});

const getAllArticles = catchAsync(async (req: Request, res: Response) => {
  // If request is from unauthenticated user or member, only show published articles by default
  const query = { ...req.query };
  const userRole = req.user?.role;
  const isStaff = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'SHIFTER';

  if (!isStaff) {
    query.isPublished = 'true';
  }

  const result = await ArticleService.getAllArticlesFromDB(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Articles retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getArticleByIdOrSlug = catchAsync(async (req: Request, res: Response) => {
  const idOrSlug = String(req.params.idOrSlug);
  const result = await ArticleService.getArticleByIdOrSlugFromDB(idOrSlug, true);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Article details retrieved successfully!',
    data: result,
  });
});

const updateArticle = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await ArticleService.updateArticleInDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Article updated successfully!',
    data: result,
  });
});

const deleteArticle = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await ArticleService.deleteArticleFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Article deleted successfully!',
    data: result,
  });
});

const getArticleCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await ArticleService.getArticleCategoriesFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Article categories retrieved successfully!',
    data: result,
  });
});

const uploadArticleCover = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please select an image file to upload!',
      data: null,
    });
  }

  const coverImageUrl = ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  if (!coverImageUrl) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Failed to retrieve uploaded image URL from Cloudinary.',
      data: null,
    });
  }

  const articleId = req.body?.articleId ? Number(req.body.articleId) : undefined;
  if (articleId) {
    await ArticleService.updateArticleInDB(articleId, { coverImage: coverImageUrl });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Article cover image uploaded to Cloudinary successfully!',
    data: { url: coverImageUrl },
  });
});

export const ArticleController = {
  createArticle,
  getAllArticles,
  getArticleByIdOrSlug,
  updateArticle,
  deleteArticle,
  getArticleCategories,
  uploadArticleCover,
};

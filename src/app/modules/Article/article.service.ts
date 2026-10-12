import httpStatus from 'http-status';
import { Organization } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreateArticle, TSubmitArticle, TUpdateArticle } from './article.interface';

const calculateReadTime = (content: string): number => {
  if (!content) return 1;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const ensureUniqueSlug = async (baseSlug: string, currentArticleId?: number): Promise<string> => {
  let slug = baseSlug || 'article';
  let counter = 1;

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug },
    });

    if (!existing || (currentArticleId && existing.id === currentArticleId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const formatArticleResponse = (article: any) => {
  if (!article) return article;
  return {
    ...article,
    authorName: article.author?.name || article.authorName || 'Contributor',
    authorDesignation: article.author?.authorDesignation || article.authorDesignation || null,
    authorAvatar: article.author?.avatar || null,
  };
};

const createArticleIntoDB = async (payload: TCreateArticle, requestingUserId?: number) => {
  const baseSlug = payload.slug ? createSlug(payload.slug) : createSlug(payload.title);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const readTime = payload.totalReadTime && payload.totalReadTime > 0
    ? payload.totalReadTime
    : calculateReadTime(payload.content);

  let authorId = payload.authorId || null;
  if (!authorId && payload.authorName && payload.authorName.trim()) {
    const name = payload.authorName.trim();
    let author = await prisma.author.findFirst({ where: { name } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          name,
          authorDesignation: payload.authorDesignation || null,
          bio: payload.authorBio || null,
        },
      });
    }
    authorId = author.id;
  }

  const article = await prisma.article.create({
    data: {
      org: payload.org || Organization.RUIL,
      title: payload.title,
      slug: uniqueSlug,
      content: payload.content,
      coverImage: payload.coverImage || null,
      category: payload.category || 'General',
      authorId,
      authorName: payload.authorName,
      authorDesignation: payload.authorDesignation || null,
      authorBio: payload.authorBio || null,
      relatedBookId: payload.relatedBookId || null,
      totalReadTime: readTime,
      isPublished: payload.isPublished ?? false,
    },
    include: {
      author: true,
      relatedBook: {
        select: {
          id: true,
          title: true,
          coverImage: true,
          isbn: true,
        },
      },
    },
  });

  return formatArticleResponse(article);
};

const submitArticleIntoDB = async (payload: TSubmitArticle, requestingUserId?: number) => {
  const baseSlug = createSlug(payload.title);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);
  const readTime = calculateReadTime(payload.content);

  let authorUser = null;
  if (requestingUserId) {
    authorUser = await prisma.user.findUnique({ where: { id: requestingUserId } });
  }

  const authorName = payload.authorName || authorUser?.name || 'Guest Contributor';
  const designation = payload.authorDesignation || (payload.authorEmail ? `Email: ${payload.authorEmail}` : null);

  const article = await prisma.article.create({
    data: {
      org: payload.org || Organization.RUIL,
      title: payload.title,
      slug: uniqueSlug,
      content: payload.content,
      coverImage: payload.coverImage || null,
      category: payload.category || 'General',
      authorName,
      authorDesignation: designation,
      authorBio: payload.authorBio || null,
      totalReadTime: readTime,
      isPublished: false, // Must be reviewed and approved by admin / super admin
    },
    include: {
      author: true,
    },
  });

  return formatArticleResponse(article);
};

const getAllArticlesFromDB = async (query: Record<string, unknown>) => {
  const { category, isPublished, org, authorId, sortBy, sortOrder = 'desc', ...queryParams } = query;

  const articleQuery = new QueryBuilder(prisma.article, queryParams, {
    searchableFields: ['title', 'content', 'authorName', 'category', 'slug'],
    filterableFields: ['category', 'isPublished', 'authorId'],
  })
    .search()
    .filter()
    .paginate()
    .fields();

  if (category && category !== 'ALL') {
    articleQuery.where({ category: String(category) });
  }

  if (isPublished !== undefined) {
    articleQuery.where({ isPublished: isPublished === 'true' || isPublished === true });
  }

  if (org && org !== 'ALL') {
    articleQuery.where({ org: org as Organization });
  }

  if (authorId) {
    articleQuery.where({ authorId: Number(authorId) });
  }

  if (sortBy) {
    articleQuery.orderBy({
      [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
    });
  } else {
    articleQuery.orderBy({
      createdAt: 'desc',
    });
  }

  articleQuery.include({
    author: true,
    relatedBook: {
      select: {
        id: true,
        title: true,
        coverImage: true,
        isbn: true,
      },
    },
  });

  const result = await articleQuery.execute();

  return {
    meta: result.meta,
    data: result.data.map(formatArticleResponse),
  };
};

const getArticleByIdOrSlugFromDB = async (idOrSlug: string | number, incrementView = false) => {
  const isNumeric = !isNaN(Number(idOrSlug));

  let article;
  if (isNumeric) {
    article = await prisma.article.findUnique({
      where: { id: Number(idOrSlug) },
      include: {
        author: true,
        relatedBook: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            isbn: true,
          },
        },
      },
    });
  } else {
    article = await prisma.article.findUnique({
      where: { slug: String(idOrSlug) },
      include: {
        author: true,
        relatedBook: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            isbn: true,
          },
        },
      },
    });
  }

  if (!article) {
    throw new AppError(httpStatus.NOT_FOUND, 'Article not found!');
  }

  if (incrementView) {
    prisma.article.update({
      where: { id: article.id },
      data: { totalViews: { increment: 1 } },
    }).catch(() => {});
  }

  return formatArticleResponse(article);
};

const updateArticleInDB = async (id: number, payload: TUpdateArticle) => {
  const existingArticle = await prisma.article.findUnique({
    where: { id },
  });

  if (!existingArticle) {
    throw new AppError(httpStatus.NOT_FOUND, 'Article not found!');
  }

  const updateData: Record<string, any> = {};

  if (payload.org !== undefined) updateData.org = payload.org;
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.coverImage !== undefined) updateData.coverImage = payload.coverImage;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.authorName !== undefined) updateData.authorName = payload.authorName;
  if (payload.authorDesignation !== undefined) updateData.authorDesignation = payload.authorDesignation;
  if (payload.authorBio !== undefined) updateData.authorBio = payload.authorBio;
  if (payload.relatedBookId !== undefined) updateData.relatedBookId = payload.relatedBookId;
  if (payload.authorId !== undefined) updateData.authorId = payload.authorId;

  // When approving or publishing an article:
  // If the article does not yet have an authorId, create or find the Author in the Author table!
  if (payload.isPublished !== undefined) {
    updateData.isPublished = payload.isPublished;

    if (payload.isPublished === true) {
      const targetAuthorId = payload.authorId ?? existingArticle.authorId;
      if (!targetAuthorId) {
        const name = (payload.authorName || existingArticle.authorName || '').trim();
        if (name) {
          let author = await prisma.author.findFirst({ where: { name } });
          if (!author) {
            author = await prisma.author.create({
              data: {
                name,
                authorDesignation: payload.authorDesignation || existingArticle.authorDesignation || null,
                bio: payload.authorBio || existingArticle.authorBio || null,
              },
            });
          }
          updateData.authorId = author.id;
        }
      }
    }
  }

  if (payload.slug && payload.slug !== existingArticle.slug) {
    const slugBase = createSlug(payload.slug);
    updateData.slug = await ensureUniqueSlug(slugBase, id);
  } else if (payload.title && !existingArticle.slug) {
    updateData.slug = await ensureUniqueSlug(createSlug(payload.title), id);
  }

  if (payload.totalReadTime !== undefined) {
    updateData.totalReadTime = payload.totalReadTime;
  } else if (payload.content) {
    updateData.totalReadTime = calculateReadTime(payload.content);
  }

  const updated = await prisma.article.update({
    where: { id },
    data: updateData,
    include: {
      author: true,
      relatedBook: {
        select: {
          id: true,
          title: true,
          coverImage: true,
          isbn: true,
        },
      },
    },
  });

  return formatArticleResponse(updated);
};

const deleteArticleFromDB = async (id: number) => {
  const existingArticle = await prisma.article.findUnique({
    where: { id },
  });

  if (!existingArticle) {
    throw new AppError(httpStatus.NOT_FOUND, 'Article not found!');
  }

  return await prisma.article.delete({
    where: { id },
  });
};

const getArticleCategoriesFromDB = async () => {
  const categories = await prisma.article.groupBy({
    by: ['category'],
    where: { isPublished: true },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  return categories.map((c) => ({
    category: c.category,
    count: c._count.id,
  }));
};

export const ArticleService = {
  createArticleIntoDB,
  submitArticleIntoDB,
  getAllArticlesFromDB,
  getArticleByIdOrSlugFromDB,
  updateArticleInDB,
  deleteArticleFromDB,
  getArticleCategoriesFromDB,
};

import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreateArticle, TUpdateArticle } from './article.interface';

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

const createArticleIntoDB = async (payload: TCreateArticle, requestingUserId?: number) => {
  const baseSlug = payload.slug ? createSlug(payload.slug) : createSlug(payload.title);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const readTime = payload.totalReadTime && payload.totalReadTime > 0
    ? payload.totalReadTime
    : calculateReadTime(payload.content);

  const authorUserId = payload.authorUserId ?? requestingUserId ?? null;

  return await prisma.article.create({
    data: {
      title: payload.title,
      slug: uniqueSlug,
      content: payload.content,
      coverImage: payload.coverImage || null,
      category: payload.category || 'General',
      authorUserId: authorUserId,
      authorName: payload.authorName,
      authorDesignation: payload.authorDesignation || null,
      relatedBookId: payload.relatedBookId || null,
      totalReadTime: readTime,
      isPublished: payload.isPublished ?? false,
    },
    include: {
      authorUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      relatedBook: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
          isbn: true,
        },
      },
    },
  });
};

const getAllArticlesFromDB = async (query: Record<string, unknown>) => {
  const { category, isPublished, sortBy, sortOrder = 'desc', ...queryParams } = query;

  const articleQuery = new QueryBuilder(prisma.article, queryParams, {
    searchableFields: ['title', 'content', 'authorName', 'category', 'slug'],
    filterableFields: ['category', 'isPublished', 'authorUserId'],
  })
    .search()
    .filter()
    .paginate()
    .fields();

  if (category && typeof category === 'string' && category !== 'ALL') {
    articleQuery.where({
      category: { equals: category.trim(), mode: 'insensitive' },
    });
  }

  if (isPublished !== undefined) {
    const publishedBool = isPublished === 'true' || isPublished === true;
    articleQuery.where({
      isPublished: publishedBool,
    });
  }

  // Include relations
  articleQuery.include({
    authorUser: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    relatedBook: {
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        isbn: true,
      },
    },
  });

  if (sortBy) {
    articleQuery.orderBy({
      [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
    });
  } else {
    articleQuery.orderBy({
      createdAt: 'desc',
    });
  }

  return await articleQuery.execute();
};

const getArticleByIdOrSlugFromDB = async (idOrSlug: string | number, incrementView: boolean = true) => {
  const isNumeric = typeof idOrSlug === 'number' || (!isNaN(Number(idOrSlug)) && !isNaN(parseFloat(String(idOrSlug))));

  let article;
  if (isNumeric) {
    article = await prisma.article.findFirst({
      where: {
        OR: [
          { id: Number(idOrSlug) },
          { slug: String(idOrSlug) },
        ],
      },
      include: {
        authorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        relatedBook: {
          select: {
            id: true,
            title: true,
            author: true,
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
        authorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        relatedBook: {
          select: {
            id: true,
            title: true,
            author: true,
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
    // Increment view count asynchronously in background
    prisma.article.update({
      where: { id: article.id },
      data: { totalViews: { increment: 1 } },
    }).catch(() => {});
  }

  return article;
};

const updateArticleInDB = async (id: number, payload: TUpdateArticle) => {
  const existingArticle = await prisma.article.findUnique({
    where: { id },
  });

  if (!existingArticle) {
    throw new AppError(httpStatus.NOT_FOUND, 'Article not found!');
  }

  const updateData: Record<string, any> = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.coverImage !== undefined) updateData.coverImage = payload.coverImage;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.authorName !== undefined) updateData.authorName = payload.authorName;
  if (payload.authorDesignation !== undefined) updateData.authorDesignation = payload.authorDesignation;
  if (payload.authorUserId !== undefined) updateData.authorUserId = payload.authorUserId;
  if (payload.relatedBookId !== undefined) updateData.relatedBookId = payload.relatedBookId;
  if (payload.isPublished !== undefined) updateData.isPublished = payload.isPublished;

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

  return await prisma.article.update({
    where: { id },
    data: updateData,
    include: {
      authorUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      relatedBook: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
          isbn: true,
        },
      },
    },
  });
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

  const defaultCategories = [
    'Monthly Newspaper',
    'Scholarly Article',
    'Library Notice',
    'Manuscript Review',
    'Islamic Research',
    'Book Excerpt',
  ];

  const map = new Map<string, number>();
  defaultCategories.forEach((cat) => map.set(cat, 0));
  categories.forEach((c) => {
    if (c.category) {
      map.set(c.category, c._count.id);
    }
  });

  return Array.from(map.entries()).map(([category, count]) => ({
    category,
    count,
  }));
};

export const ArticleService = {
  createArticleIntoDB,
  getAllArticlesFromDB,
  getArticleByIdOrSlugFromDB,
  updateArticleInDB,
  deleteArticleFromDB,
  getArticleCategoriesFromDB,
};

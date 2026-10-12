import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreateAuthor, TUpdateAuthor } from './author.interface';

const createAuthorIntoDB = async (payload: TCreateAuthor) => {
  return await prisma.author.create({
    data: {
      name: payload.name.trim(),
      avatar: payload.avatar || null,
      bio: payload.bio || null,
      authorDesignation: payload.authorDesignation || null,
      socialLinks: payload.socialLinks || undefined,
      userId: payload.userId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
};

const getAllAuthorsFromDB = async (query: Record<string, unknown>) => {
  const { searchTerm, name, ...queryParams } = query;

  const authorQuery = new QueryBuilder(prisma.author, queryParams, {
    searchableFields: ['name', 'authorDesignation', 'bio'],
    filterableFields: ['userId'],
  })
    .search()
    .filter()
    .paginate()
    .fields();

  authorQuery
    .include({
      _count: {
        select: {
          books: true,
          articles: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    })
    .orderBy({
      name: 'asc',
    });

  return await authorQuery.execute();
};

const getAuthorByIdFromDB = async (id: number) => {
  const author = await prisma.author.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      books: {
        include: {
          book: {
            include: {
              publisher: true,
            },
          },
        },
      },
      articles: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          coverImage: true,
          totalViews: true,
          totalReadTime: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          books: true,
          articles: true,
        },
      },
    },
  });

  if (!author) {
    throw new AppError(httpStatus.NOT_FOUND, 'Author not found!');
  }

  return author;
};

const updateAuthorInDB = async (id: number, payload: TUpdateAuthor) => {
  const existing = await prisma.author.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Author not found!');
  }

  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.avatar !== undefined) updateData.avatar = payload.avatar;
  if (payload.bio !== undefined) updateData.bio = payload.bio;
  if (payload.authorDesignation !== undefined) updateData.authorDesignation = payload.authorDesignation;
  if (payload.socialLinks !== undefined) updateData.socialLinks = payload.socialLinks;
  if (payload.userId !== undefined) updateData.userId = payload.userId;

  return await prisma.author.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          books: true,
          articles: true,
        },
      },
    },
  });
};

const deleteAuthorFromDB = async (id: number) => {
  const existing = await prisma.author.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          books: true,
          articles: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Author not found!');
  }

  return await prisma.author.delete({
    where: { id },
  });
};

export const AuthorService = {
  createAuthorIntoDB,
  getAllAuthorsFromDB,
  getAuthorByIdFromDB,
  updateAuthorInDB,
  deleteAuthorFromDB,
};

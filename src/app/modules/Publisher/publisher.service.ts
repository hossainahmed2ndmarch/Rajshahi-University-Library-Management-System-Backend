import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreatePublisher, TUpdatePublisher } from './publisher.interface';

const createPublisherIntoDB = async (payload: TCreatePublisher) => {
  const existing = await prisma.publisher.findUnique({
    where: { name: payload.name.trim() },
  });

  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'A publisher with this name already exists!');
  }

  return await prisma.publisher.create({
    data: {
      name: payload.name.trim(),
      logo: payload.logo || null,
      description: payload.description || null,
      websiteUrl: payload.websiteUrl || null,
      defaultDiscount: payload.defaultDiscount !== undefined ? payload.defaultDiscount : 0,
    },
  });
};

const getAllPublishersFromDB = async (query: Record<string, unknown>) => {
  const { searchTerm, name, ...queryParams } = query;

  const publisherQuery = new QueryBuilder(prisma.publisher, queryParams, {
    searchableFields: ['name', 'description'],
    filterableFields: [],
  })
    .search()
    .filter()
    .paginate()
    .fields();

  publisherQuery
    .include({
      _count: {
        select: {
          books: true,
        },
      },
    })
    .orderBy({
      name: 'asc',
    });

  return await publisherQuery.execute();
};

const getPublisherByIdFromDB = async (id: number) => {
  const publisher = await prisma.publisher.findUnique({
    where: { id },
    include: {
      books: {
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      },
      _count: {
        select: {
          books: true,
        },
      },
    },
  });

  if (!publisher) {
    throw new AppError(httpStatus.NOT_FOUND, 'Publisher not found!');
  }

  return publisher;
};

const updatePublisherInDB = async (id: number, payload: TUpdatePublisher) => {
  const existing = await prisma.publisher.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Publisher not found!');
  }

  if (payload.name && payload.name.trim() !== existing.name) {
    const duplicate = await prisma.publisher.findUnique({
      where: { name: payload.name.trim() },
    });
    if (duplicate) {
      throw new AppError(httpStatus.BAD_REQUEST, 'A publisher with this name already exists!');
    }
  }

  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.logo !== undefined) updateData.logo = payload.logo;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.websiteUrl !== undefined) updateData.websiteUrl = payload.websiteUrl;
  if (payload.defaultDiscount !== undefined) updateData.defaultDiscount = payload.defaultDiscount;

  return await prisma.publisher.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          books: true,
        },
      },
    },
  });
};

const deletePublisherFromDB = async (id: number) => {
  const existing = await prisma.publisher.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Publisher not found!');
  }

  return await prisma.publisher.delete({
    where: { id },
  });
};

export const PublisherService = {
  createPublisherIntoDB,
  getAllPublishersFromDB,
  getPublisherByIdFromDB,
  updatePublisherInDB,
  deletePublisherFromDB,
};

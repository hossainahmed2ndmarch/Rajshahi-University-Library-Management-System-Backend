import httpStatus from 'http-status';
import { BookType, Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TCreateBook, TUpdateBook } from './book.interface';

const createBookIntoDB = async (payload: TCreateBook, adminId?: number) => {
  const existingIsbn = await prisma.book.findUnique({
    where: { isbn: payload.isbn },
  });

  if (existingIsbn) {
    throw new AppError(httpStatus.BAD_REQUEST, 'A book with this ISBN already exists!');
  }

  const bookData = {
    ...payload,
    addedById: adminId || null,
  };

  return await prisma.book.create({
    data: bookData,
  });
};

const getAllBooksFromDB = async (query: Record<string, unknown>) => {
  const { isBorrowable, isSellable, sortBy, sortOrder = 'desc', isArchived, ...queryParams } = query;

  // Set up QueryBuilder with searchable and filterable fields
  // Default isArchived to false so deleted/archived books are hidden from regular listings
  const bookQuery = new QueryBuilder(prisma.book, { ...queryParams, isArchived: isArchived ?? false }, {
    searchableFields: ['title', 'author', 'isbn', 'category', 'publisher', 'locationCell', 'description'],
    filterableFields: ['category', 'author', 'type', 'isArchived', 'publisher'],
  })
    .search()
    .filter()
    .paginate()
    .fields();

  // Filter for borrowable books (BORROW_ONLY or HYBRID)
  if (isBorrowable === 'true' || isBorrowable === true) {
    bookQuery.where({
      type: {
        in: [BookType.BORROW_ONLY, BookType.HYBRID],
      },
    });
  }

  // Filter for sellable books (SELL_ONLY or HYBRID)
  if (isSellable === 'true' || isSellable === true) {
    bookQuery.where({
      type: {
        in: [BookType.SELL_ONLY, BookType.HYBRID],
      },
    });
  }

  // Custom Sorting Logic
  if (sortBy === 'createdAt') {
    // 1. New Arrivals: Sort by creation timestamp
    bookQuery.orderBy({
      createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
    });
  } else if (sortBy === 'borrowCount') {
    // 2. Most Borrowed: Sort by relation count on borrowRecords table
    bookQuery.orderBy({
      borrowRecords: {
        _count: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    });
  } else if (sortBy) {
    // 3. Generic field sorting
    bookQuery.orderBy({
      [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
    });
  } else {
    // Default fallback: Newest first
    bookQuery.orderBy({
      createdAt: 'desc',
    });
  }

  return await bookQuery.execute();
};

const getBookByIdFromDB = async (id: number) => {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      addedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      donatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found!');
  }

  const totalReviews = book.reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((book.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews).toFixed(2))
      : 0;

  return {
    ...book,
    reviewSummary: {
      totalReviews,
      averageRating,
    },
  };
};

const updateBookInDB = async (id: number, payload: TUpdateBook) => {
  const book = await prisma.book.findUnique({
    where: { id },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found!');
  }

  if (payload.isbn && payload.isbn !== book.isbn) {
    const existingIsbn = await prisma.book.findUnique({
      where: { isbn: payload.isbn },
    });
    if (existingIsbn) {
      throw new AppError(httpStatus.BAD_REQUEST, 'A book with this ISBN already exists!');
    }
  }

  const updateData: Record<string, any> = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.author !== undefined) updateData.author = payload.author;
  if (payload.isbn !== undefined) updateData.isbn = payload.isbn;
  if (payload.locationCell !== undefined) updateData.locationCell = payload.locationCell;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.publisher !== undefined) updateData.publisher = payload.publisher;
  if (payload.pages !== undefined) updateData.pages = Number(payload.pages);
  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.buyPrice !== undefined) updateData.buyPrice = payload.buyPrice !== null ? Number(payload.buyPrice) : null;
  if (payload.sellPrice !== undefined) updateData.sellPrice = payload.sellPrice !== null ? Number(payload.sellPrice) : null;
  if (payload.discount !== undefined) updateData.discount = Number(payload.discount);
  if (payload.borrowStock !== undefined) updateData.borrowStock = Number(payload.borrowStock);
  if (payload.sellStock !== undefined) updateData.sellStock = Number(payload.sellStock);
  if (payload.coverImage !== undefined) updateData.coverImage = payload.coverImage;
  if (payload.images !== undefined) updateData.images = payload.images;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.isArchived !== undefined) updateData.isArchived = Boolean(payload.isArchived);

  return await prisma.book.update({
    where: { id },
    data: updateData,
  });
};

const deleteBookFromDB = async (id: number) => {
  const book = await prisma.book.findUnique({
    where: { id },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found!');
  }

  // Hard delete: permanently remove the book record
  return await prisma.book.delete({
    where: { id },
  });
};

const getBookCategoriesFromDB = async () => {
  const categories = await prisma.book.groupBy({
    by: ['category'],
    where: { isArchived: false },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  const categoriesWithBooks = await Promise.all(
    categories.map(async (c) => {
      const books = await prisma.book.findMany({
        where: {
          category: c.category,
          isArchived: false,
        },
        select: {
          id: true,
          title: true,
          coverImage: true,
          author: true,
        },
        take: 4,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        category: c.category,
        count: c._count.id,
        books,
      };
    })
  );

  return categoriesWithBooks;
};

export const BookService = {
  createBookIntoDB,
  getAllBooksFromDB,
  getBookByIdFromDB,
  getBookCategoriesFromDB,
  updateBookInDB,
  deleteBookFromDB,
};
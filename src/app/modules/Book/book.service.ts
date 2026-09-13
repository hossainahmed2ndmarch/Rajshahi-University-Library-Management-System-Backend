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

  // Handle multiple categories
  let categories: string[] = [];
  if (Array.isArray(payload.categories) && payload.categories.length > 0) {
    categories = Array.from(new Set(payload.categories.map((c) => c.trim()).filter(Boolean)));
  } else if (payload.category) {
    categories = payload.category
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }
  const categoryStr = categories.length > 0 ? categories.join(', ') : payload.category || 'General';

  // Handle multiple authors with roles (WRITER / TRANSLATOR)
  let authors = payload.authors;
  let authorStr = payload.author || '';
  if (Array.isArray(authors) && authors.length > 0) {
    authorStr = authors
      .map((a) => (a.role === 'TRANSLATOR' ? `${a.name.trim()} (Translator)` : a.name.trim()))
      .join(', ');
  } else if (payload.author) {
    authors = [{ name: payload.author.trim(), role: 'WRITER' }];
  }

  const bookData: any = {
    ...payload,
    author: authorStr,
    authors: authors || undefined,
    category: categoryStr,
    categories,
    addedById: adminId || null,
  };

  return await prisma.book.create({
    data: bookData,
  });
};

const getAllBooksFromDB = async (query: Record<string, unknown>) => {
  const { isBorrowable, isSellable, sortBy, sortOrder = 'desc', isArchived, category, author, ...queryParams } = query;

  // Set up QueryBuilder with searchable and filterable fields
  // Default isArchived to false so deleted/archived books are hidden from regular listings
  const bookQuery = new QueryBuilder(prisma.book, { ...queryParams, isArchived: isArchived ?? false }, {
    searchableFields: ['title', 'author', 'isbn', 'category', 'publisher', 'locationCell', 'description'],
    filterableFields: ['type', 'isArchived', 'publisher'],
  })
    .search()
    .filter()
    .paginate()
    .fields();

  if (category && typeof category === 'string' && category !== 'ALL') {
    bookQuery.where({
      OR: [
        { categories: { has: category.trim() } },
        { category: { contains: category.trim(), mode: 'insensitive' } },
      ],
    });
  }

  if (author && typeof author === 'string') {
    bookQuery.where({
      author: { contains: author.trim(), mode: 'insensitive' },
    });
  }

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

  // Handle authors
  if (payload.authors !== undefined) {
    updateData.authors = payload.authors;
    if (Array.isArray(payload.authors) && payload.authors.length > 0) {
      updateData.author = payload.authors
        .map((a) => (a.role === 'TRANSLATOR' ? `${a.name.trim()} (Translator)` : a.name.trim()))
        .join(', ');
    } else if (payload.author !== undefined) {
      updateData.author = payload.author;
    }
  } else if (payload.author !== undefined) {
    updateData.author = payload.author;
    updateData.authors = [{ name: payload.author.trim(), role: 'WRITER' }];
  }

  // Handle categories
  if (payload.categories !== undefined) {
    const cats = Array.from(new Set(payload.categories.map((c) => c.trim()).filter(Boolean)));
    updateData.categories = cats;
    updateData.category = cats.join(', ');
  } else if (payload.category !== undefined) {
    updateData.category = payload.category;
    updateData.categories = payload.category.split(',').map((c) => c.trim()).filter(Boolean);
  }

  if (payload.isbn !== undefined) updateData.isbn = payload.isbn;
  if (payload.locationCell !== undefined) updateData.locationCell = payload.locationCell;
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

const getBookOptionsFromDB = async () => {
  const books = await prisma.book.findMany({
    where: { isArchived: false },
    select: {
      category: true,
      categories: true,
      locationCell: true,
      publisher: true,
      author: true,
      authors: true,
    },
  });

  const categoriesSet = new Set<string>();
  const locationCellsSet = new Set<string>();
  const publishersSet = new Set<string>();
  const authorsMap = new Map<string, 'WRITER' | 'TRANSLATOR'>();

  for (const book of books) {
    // Categories
    if (Array.isArray(book.categories) && book.categories.length > 0) {
      book.categories.forEach((c) => {
        const trimmed = c?.trim();
        if (trimmed) categoriesSet.add(trimmed);
      });
    } else if (book.category) {
      book.category.split(',').forEach((c) => {
        const trimmed = c?.trim();
        if (trimmed) categoriesSet.add(trimmed);
      });
    }

    // Location Cells
    if (book.locationCell) {
      const trimmed = book.locationCell.trim();
      if (trimmed && trimmed !== 'Rack-Unassigned' && trimmed !== 'Cell-Unassigned') {
        locationCellsSet.add(trimmed);
      }
    }

    // Publishers
    if (book.publisher) {
      const trimmed = book.publisher.trim();
      if (trimmed && trimmed !== 'N/A') {
        publishersSet.add(trimmed);
      }
    }

    // Authors
    if (Array.isArray(book.authors) && (book.authors as any[]).length > 0) {
      (book.authors as any[]).forEach((a) => {
        const name = a.name?.trim();
        const role = a.role === 'TRANSLATOR' ? 'TRANSLATOR' : 'WRITER';
        if (name) {
          if (!authorsMap.has(name) || role === 'WRITER') {
            authorsMap.set(name, role);
          }
        }
      });
    } else if (book.author) {
      book.author.split(',').forEach((part) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const isTrans = trimmed.toLowerCase().includes('(translator)');
        const cleanName = trimmed.replace(/\(translator\)/i, '').trim();
        if (cleanName) {
          const role = isTrans ? 'TRANSLATOR' : 'WRITER';
          if (!authorsMap.has(cleanName) || role === 'WRITER') {
            authorsMap.set(cleanName, role);
          }
        }
      });
    }
  }

  // Include default Islamic library catalog categories if missing
  const defaultCategories = [
    'Tafsir',
    'Hadith',
    'Seerah',
    'Fiqh',
    'Aqeedah',
    'History',
    'Spirituality',
    'Arabic Language',
    'Comparative Religion',
    'Islamic Economics',
    'Family & Society',
    'Quranic Sciences',
  ];
  defaultCategories.forEach((c) => categoriesSet.add(c));

  const authors = Array.from(authorsMap.entries())
    .map(([name, role]) => ({ name, role }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b)),
    locationCells: Array.from(locationCellsSet).sort((a, b) => a.localeCompare(b)),
    publishers: Array.from(publishersSet).sort((a, b) => a.localeCompare(b)),
    authors,
  };
};

export const BookService = {
  createBookIntoDB,
  getAllBooksFromDB,
  getBookByIdFromDB,
  getBookCategoriesFromDB,
  getBookOptionsFromDB,
  updateBookInDB,
  deleteBookFromDB,
};
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BookService } from './book.service';

const createBook = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?.userId ? Number(req.user.userId) : undefined;
  const result = await BookService.createBookIntoDB(req.body, adminId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Book created successfully!',
    data: result,
  });
});

const getAllBooks = catchAsync(async (req: Request, res: Response) => {
  const result = await BookService.getAllBooksFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Books catalog retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getBookById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookService.getBookByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book details retrieved successfully!',
    data: result,
  });
});

const updateBook = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookService.updateBookInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book updated successfully!',
    data: result,
  });
});

const deleteBook = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookService.deleteBookFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book archived successfully!',
    data: result,
  });
});

const getBookCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await BookService.getBookCategoriesFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book categories retrieved successfully!',
    data: result,
  });
});

/**
 * POST /books/upload-cover
 * Uploads a book cover image to Cloudinary and returns the secure URL.
 * Optionally, if a bookId is provided in the body, it immediately updates
 * the book record's coverImage field in the database.
 */
const uploadBookCover = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please select an image file to upload!',
      data: null,
    });
  }

  // CloudinaryStorage sets req.file.path or req.file.secure_url to the Cloudinary HTTPS URL
  const coverImageUrl = ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  if (!coverImageUrl) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Failed to retrieve uploaded image URL from Cloudinary.',
      data: null,
    });
  }

  // If a bookId was provided, persist the URL directly to the book record
  const bookId = req.body?.bookId ? Number(req.body.bookId) : undefined;
  if (bookId) {
    await BookService.updateBookInDB(bookId, { coverImage: coverImageUrl });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book cover image uploaded to Cloudinary successfully!',
    data: { url: coverImageUrl },
  });
});

/**
 * POST /books/upload-images
 * Uploads multiple book images (e.g. preview pages, inside photos) to Cloudinary
 * and returns an array of secure URLs.
 */
const uploadBookImages = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  if (!files || files.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please select one or more image files to upload!',
      data: null,
    });
  }

  const urls = files
    .map((file: any) => (file.path || file.secure_url || file.url) as string)
    .filter(Boolean);

  if (urls.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Failed to retrieve uploaded image URLs from Cloudinary.',
      data: null,
    });
  }

  const bookId = req.body?.bookId ? Number(req.body.bookId) : undefined;
  if (bookId) {
    const existingBook = await BookService.getBookByIdFromDB(bookId);
    const updatedImages = Array.from(new Set([...(existingBook.images || []), ...urls]));
    await BookService.updateBookInDB(bookId, { images: updatedImages });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${urls.length} book image(s) uploaded to Cloudinary successfully!`,
    data: { urls },
  });
});

export const BookController = {
  createBook,
  getAllBooks,
  getBookById,
  getBookCategories,
  updateBook,
  deleteBook,
  uploadBookCover,
  uploadBookImages,
};

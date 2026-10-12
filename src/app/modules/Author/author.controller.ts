import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthorService } from './author.service';

const createAuthor = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthorService.createAuthorIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Author created successfully!',
    data: result,
  });
});

const getAllAuthors = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthorService.getAllAuthorsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authors retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getAuthorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AuthorService.getAuthorByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Author retrieved successfully!',
    data: result,
  });
});

const updateAuthor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AuthorService.updateAuthorInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Author updated successfully!',
    data: result,
  });
});

const deleteAuthor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AuthorService.deleteAuthorFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Author deleted successfully!',
    data: result,
  });
});

const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please select an image file to upload!',
      data: null,
    });
  }

  const avatarUrl = ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  if (!avatarUrl) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Failed to retrieve uploaded image URL from Cloudinary.',
      data: null,
    });
  }

  const authorId = req.body?.authorId ? Number(req.body.authorId) : undefined;
  if (authorId) {
    await AuthorService.updateAuthorInDB(authorId, { avatar: avatarUrl });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Author avatar uploaded successfully!',
    data: { avatarUrl },
  });
});

export const AuthorController = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  uploadAvatar,
};

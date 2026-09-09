import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewService } from './review.service';

const createBookReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId || req.user?.id ? Number(req.user?.userId || req.user?.id) : undefined;
  const userRole = req.user?.role as string | undefined;
  const result = await ReviewService.createBookReviewInDB(req.body, userId, userRole);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Book review submitted successfully!',
    data: result,
  });
});

const createServiceReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId || req.user?.id ? Number(req.user?.userId || req.user?.id) : undefined;
  const result = await ReviewService.createServiceReviewInDB(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Service review submitted successfully!',
    data: result,
  });
});

const getServiceReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getServiceReviewsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service reviews retrieved successfully!',
    data: result,
  });
});

const getBookReviews = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const result = await ReviewService.getBookReviewsFromDB(Number(bookId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book reviews retrieved successfully!',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = {
    userId: Number(req.user?.userId || req.user?.id),
    role: req.user?.role as string,
  };
  const result = await ReviewService.updateBookReviewInDB(Number(id), req.body, requestingUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully!',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = {
    userId: Number(req.user?.userId || req.user?.id),
    role: req.user?.role as string,
  };
  const result = await ReviewService.deleteBookReviewInDB(Number(id), requestingUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully!',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getAllReviewsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All book and service reviews retrieved successfully!',
    data: result,
  });
});

export const ReviewController = {
  createBookReview,
  createServiceReview,
  getServiceReviews,
  getBookReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};


import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PublisherService } from './publisher.service';

const createPublisher = catchAsync(async (req: Request, res: Response) => {
  const result = await PublisherService.createPublisherIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Publisher created successfully!',
    data: result,
  });
});

const getAllPublishers = catchAsync(async (req: Request, res: Response) => {
  const result = await PublisherService.getAllPublishersFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Publishers retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getPublisherById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PublisherService.getPublisherByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Publisher retrieved successfully!',
    data: result,
  });
});

const updatePublisher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PublisherService.updatePublisherInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Publisher updated successfully!',
    data: result,
  });
});

const deletePublisher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PublisherService.deletePublisherFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Publisher deleted successfully!',
    data: result,
  });
});

const uploadLogo = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please select an image file to upload!',
      data: null,
    });
  }

  const logoUrl = ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  if (!logoUrl) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Failed to retrieve uploaded image URL from Cloudinary.',
      data: null,
    });
  }

  const publisherId = req.body?.publisherId ? Number(req.body.publisherId) : undefined;
  if (publisherId) {
    await PublisherService.updatePublisherInDB(publisherId, { logo: logoUrl });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Publisher logo uploaded successfully!',
    data: { logoUrl },
  });
});

export const PublisherController = {
  createPublisher,
  getAllPublishers,
  getPublisherById,
  updatePublisher,
  deletePublisher,
  uploadLogo,
};

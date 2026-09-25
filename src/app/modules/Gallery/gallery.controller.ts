import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GalleryService } from './gallery.service';

const createGalleryItem = catchAsync(async (req: Request, res: Response) => {
  const result = await GalleryService.createGalleryItemIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Gallery item created successfully!',
    data: result,
  });
});

const getAllGalleryItems = catchAsync(async (req: Request, res: Response) => {
  const result = await GalleryService.getAllGalleryItemsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gallery items retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getGalleryItemById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GalleryService.getGalleryItemByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gallery item retrieved successfully!',
    data: result,
  });
});

const updateGalleryItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GalleryService.updateGalleryItemInDB(
    Number(id),
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gallery item updated successfully!',
    data: result,
  });
});

const deleteGalleryItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GalleryService.deleteGalleryItemFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gallery item deleted successfully!',
    data: result,
  });
});

const togglePublish = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GalleryService.togglePublishInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Gallery item ${result.isPublished ? 'published' : 'unpublished'} successfully!`,
    data: result,
  });
});

const toggleFeature = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GalleryService.toggleFeatureInDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Gallery item ${result.featured ? 'marked as featured' : 'unmarked from featured'} successfully!`,
    data: result,
  });
});

const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Please select a media file to upload!',
      data: null,
    });
  }

  const mediaUrl =
    ((file as any).path || (file as any).secure_url || (file as any).url) as string;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Media uploaded successfully!',
    data: { url: mediaUrl },
  });
});

// ── Asset Specific Controllers ──────────────────────────────────────────────

const getAssetByKey = catchAsync(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const result = await GalleryService.getAssetByKeyFromDB(key);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Asset "${key}" retrieved successfully!`,
    data: result,
  });
});

const getAllAssets = catchAsync(async (req: Request, res: Response) => {
  const { org } = req.query;
  const result = await GalleryService.getAllAssetsFromDB(org as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Site assets retrieved successfully!',
    data: result,
  });
});

const upsertAsset = catchAsync(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const payload = {
    ...req.body,
    assetKey: key || req.body.assetKey,
  };
  const result = await GalleryService.upsertAssetInDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Site asset "${payload.assetKey}" saved successfully!`,
    data: result,
  });
});

const deleteAssetByKey = catchAsync(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const result = await GalleryService.deleteAssetByKeyFromDB(key);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Site asset "${key}" deleted successfully!`,
    data: result,
  });
});

const getCategories = catchAsync(async (req: Request, res: Response) => {
  const { org } = req.query;
  const categories = await GalleryService.getCategoriesFromDB(org as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gallery categories retrieved successfully!',
    data: categories,
  });
});

export const GalleryController = {
  createGalleryItem,
  getAllGalleryItems,
  getGalleryItemById,
  updateGalleryItem,
  deleteGalleryItem,
  deleteAssetByKey,
  togglePublish,
  toggleFeature,
  uploadMedia,
  getAssetByKey,
  getAllAssets,
  upsertAsset,
  getCategories,
};

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ActivityService } from './activity.service';

const createActivity = catchAsync(async (req: Request, res: Response) => {
  const result = await ActivityService.createActivityIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Activity created successfully!',
    data: result,
  });
});

const getAllActivities = catchAsync(async (req: Request, res: Response) => {
  const result = await ActivityService.getAllActivitiesFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activities retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getActivityById = catchAsync(async (req: Request, res: Response) => {
  const idOrSlug = req.params.idOrSlug as string;
  const result = await ActivityService.getActivityByIdFromDB(idOrSlug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity retrieved successfully!',
    data: result,
  });
});

const updateActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ActivityService.updateActivityInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity updated successfully!',
    data: result,
  });
});

const deleteActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ActivityService.deleteActivityFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity deleted successfully!',
    data: result,
  });
});

export const ActivityController = {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
};

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ShifterScheduleService } from './shifterSchedule.service';

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await ShifterScheduleService.createScheduleInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shifter schedule created successfully!',
    data: result,
  });
});

const getAllSchedules = catchAsync(async (req: Request, res: Response) => {
  const result = await ShifterScheduleService.getAllSchedulesFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Weekly shifter roster retrieved successfully!',
    data: result,
  });
});

const getTodaySchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await ShifterScheduleService.getTodayScheduleFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Today's duty schedule retrieved successfully!",
    data: result,
  });
});

const getMySchedule = catchAsync(async (req: Request, res: Response) => {
  const shifterId = Number(req.user?.userId || req.user?.id);
  const result = await ShifterScheduleService.getMyScheduleFromDB(shifterId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your duty schedule retrieved successfully!',
    data: result,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await ShifterScheduleService.updateScheduleInDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shifter schedule updated successfully!',
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await ShifterScheduleService.deleteScheduleInDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shifter schedule entry removed successfully!',
    data: result,
  });
});

export const ShifterScheduleController = {
  createSchedule,
  getAllSchedules,
  getTodaySchedule,
  getMySchedule,
  updateSchedule,
  deleteSchedule,
};

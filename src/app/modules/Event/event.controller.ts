import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { EventService } from './event.service';

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.createEventIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event created successfully!',
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getAllEventsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Events retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getEventByIdOrSlug = catchAsync(async (req: Request, res: Response) => {
  const idOrSlug = req.params.idOrSlug as string;
  const result = await EventService.getEventByIdOrSlugFromDB(idOrSlug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event retrieved successfully!',
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventService.updateEventInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully!',
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventService.deleteEventFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event deleted successfully!',
    data: result,
  });
});

export const EventController = {
  createEvent,
  getAllEvents,
  getEventByIdOrSlug,
  updateEvent,
  deleteEvent,
};

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { EventSessionService } from './eventSession.service';

const createSession = catchAsync(async (req: Request, res: Response) => {
  const result = await EventSessionService.createSessionIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event session created successfully!',
    data: result,
  });
});

const getSessionsByEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = Number(req.params.eventId || req.query.eventId);
  const result = await EventSessionService.getSessionsByEventFromDB(eventId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event sessions retrieved successfully!',
    data: result,
  });
});

const getSessionById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventSessionService.getSessionByIdFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event session retrieved successfully!',
    data: result,
  });
});

const updateSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventSessionService.updateSessionInDB(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event session updated successfully!',
    data: result,
  });
});

const deleteSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventSessionService.deleteSessionFromDB(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event session deleted successfully!',
    data: result,
  });
});

export const EventSessionController = {
  createSession,
  getSessionsByEvent,
  getSessionById,
  updateSession,
  deleteSession,
};

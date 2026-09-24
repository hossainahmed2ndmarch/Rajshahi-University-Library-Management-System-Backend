import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { EventMemberRecordService } from './eventMemberRecord.service';

const bulkMarkAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await EventMemberRecordService.bulkMarkAttendanceIntoDB(req.body.records);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${result.length} attendance records processed successfully!`,
    data: result,
  });
});

const submitFeedback = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user.userId);
  const result = await EventMemberRecordService.submitFeedbackIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Feedback submitted successfully and sent for review!',
    data: result,
  });
});

const selfAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user.userId);
  const result = await EventMemberRecordService.recordSelfAttendanceIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const approveFeedback = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isApproved } = req.body;
  const result = await EventMemberRecordService.approveFeedbackInDB(Number(id), Boolean(isApproved));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: isApproved ? 'Feedback approved successfully!' : 'Feedback rejected/hidden successfully!',
    data: result,
  });
});

const getRecordsByEvent = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const result = await EventMemberRecordService.getRecordsByEventFromDB(Number(eventId), req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event attendance records retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getMyRecords = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.user.userId);
  const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
  const result = await EventMemberRecordService.getMyRecordsFromDB(userId, eventId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My event records retrieved successfully!',
    data: result,
  });
});

const getEventStats = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const result = await EventMemberRecordService.getEventAttendanceStatsFromDB(Number(eventId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event statistics retrieved successfully!',
    data: result,
  });
});

export const EventMemberRecordController = {
  bulkMarkAttendance,
  submitFeedback,
  selfAttendance,
  approveFeedback,
  getRecordsByEvent,
  getMyRecords,
  getEventStats,
};

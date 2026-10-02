import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RudcTeamService } from './rudcTeam.service';

const getAllRudcTeams = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcTeamService.getAllRudcTeams();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Teams retrieved successfully!',
    data: result,
  });
});

const createRudcTeam = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcTeamService.createRudcTeam(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'RUDC Team created successfully!',
    data: result,
  });
});

const updateRudcTeam = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RudcTeamService.updateRudcTeam(Number(id), req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Team updated successfully!',
    data: result,
  });
});

const deleteRudcTeam = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RudcTeamService.deleteRudcTeam(Number(id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'RUDC Team deleted successfully!',
    data: result,
  });
});

const assignTeamMembers = catchAsync(async (req: Request, res: Response) => {
  const result = await RudcTeamService.assignTeamMembers(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Members assigned to team successfully!',
    data: result,
  });
});

const removeTeamMember = catchAsync(async (req: Request, res: Response) => {
  const { teamId, userId } = req.params;
  const result = await RudcTeamService.removeTeamMember(Number(teamId), Number(userId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Member removed from team successfully!',
    data: result,
  });
});

export const RudcTeamController = {
  getAllRudcTeams,
  createRudcTeam,
  updateRudcTeam,
  deleteRudcTeam,
  assignTeamMembers,
  removeTeamMember,
};

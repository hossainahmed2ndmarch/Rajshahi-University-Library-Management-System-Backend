import httpStatus from 'http-status';
import prisma from '../../../lib/db';
import AppError from '../../errors/AppError';
import { TAssignTeamMembersPayload, TRudcTeamPayload } from './rudcTeam.interface';

const getAllRudcTeams = async () => {
  return prisma.rudcTeam.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              rudcMemberType: true,
              rudcStatus: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createRudcTeam = async (payload: TRudcTeamPayload) => {
  const existing = await prisma.rudcTeam.findUnique({
    where: { name: payload.name },
  });
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'A team with this name already exists!');
  }

  return prisma.rudcTeam.create({
    data: payload,
  });
};

const updateRudcTeam = async (id: number, payload: Partial<TRudcTeamPayload>) => {
  return prisma.rudcTeam.update({
    where: { id },
    data: payload,
  });
};

const deleteRudcTeam = async (id: number) => {
  return prisma.rudcTeam.delete({
    where: { id },
  });
};

const assignTeamMembers = async (payload: TAssignTeamMembersPayload) => {
  const { teamId, userIds, role = 'MEMBER' } = payload;

  const team = await prisma.rudcTeam.findUnique({
    where: { id: teamId },
  });
  if (!team) {
    throw new AppError(httpStatus.NOT_FOUND, 'Team not found!');
  }

  const operations = userIds.map((userId) =>
    prisma.userRudcTeam.upsert({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      create: {
        userId,
        teamId,
        role,
      },
      update: {
        role,
      },
    })
  );

  await prisma.$transaction(operations);

  return prisma.rudcTeam.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              rudcMemberType: true,
              rudcStatus: true,
            },
          },
        },
      },
    },
  });
};

const removeTeamMember = async (teamId: number, userId: number) => {
  await prisma.userRudcTeam.delete({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  });

  return { message: 'Member removed from team successfully' };
};

export const RudcTeamService = {
  getAllRudcTeams,
  createRudcTeam,
  updateRudcTeam,
  deleteRudcTeam,
  assignTeamMembers,
  removeTeamMember,
};

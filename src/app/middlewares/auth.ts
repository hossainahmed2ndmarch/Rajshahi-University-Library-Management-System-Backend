import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../config';
import AppError from '../errors/AppError';
import { verifyToken } from '../utils/jwtHelpers';
import catchAsync from '../utils/catchAsync';
import prisma from '../../lib/db';

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const jwtToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    if (!jwtToken) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    let verifiedUser;
    try {
      verifiedUser = verifyToken(jwtToken, config.jwt.jwt_secret);
    } catch (err) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access!');
    }

    // Verify user still exists and is not BLOCKED or INACTIVE
    const user = await prisma.user.findUnique({
      where: { id: Number(verifiedUser.userId) },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User no longer exists!');
    }

    if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
      throw new AppError(httpStatus.FORBIDDEN, 'Your account is suspended or inactive!');
    }

    req.user = verifiedUser;

    if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden! You do not have permission to access this resource.');
    }

    next();
  });
};

export const optionalAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;

  if (token) {
    const jwtToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    if (jwtToken) {
      try {
        const verifiedUser = verifyToken(jwtToken, config.jwt.jwt_secret);
        req.user = verifiedUser;
      } catch {
        // Invalid or expired token - proceed as guest
      }
    }
  }

  next();
});

export default auth;

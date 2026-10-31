import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../config';
import AppError from '../errors/AppError';
import { verifyToken } from '../utils/jwtHelpers';
import catchAsync from '../utils/catchAsync';
import prisma from '../../lib/db';
import betterAuthInstance from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let userId: string | null = null;
    let role: string | null = null;

    // 1. Try Better Auth Session first
    try {
      const session = await betterAuthInstance.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (session && session.user) {
        userId = session.user.id;
        role = (session.user as any).role || 'GENERAL_USER';
      }
    } catch {
      // Fall through to JWT token check
    }

    // 2. If no Better Auth session, fallback to Bearer / JWT Token
    if (!userId) {
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.accessToken || req.cookies?.token;
      const rawToken = authHeader || cookieToken;

      if (!rawToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      const jwtToken = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;

      if (!jwtToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
      }

      try {
        const verifiedUser = verifyToken(jwtToken, config.jwt.jwt_secret);
        userId = String(verifiedUser.userId);
        role = verifiedUser.role;
      } catch (err) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access!');
      }
    }

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    // 3. Verify user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true, org: true },
    });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User no longer exists!');
    }

    if (user.status === 'BLOCKED') {
      throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended!');
    }

    if (user.status === 'INACTIVE' && user.org !== 'RUDC' && user.org !== 'BOTH') {
      throw new AppError(httpStatus.FORBIDDEN, 'Your account is inactive!');
    }

    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email || '',
      role: user.role,
      status: user.status,
      org: user.org,
    };

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Forbidden! You do not have permission to access this resource.'
      );
    }

    next();
  });
};

export const optionalAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await betterAuthInstance.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session && session.user) {
      req.user = {
        userId: session.user.id,
        id: session.user.id,
        email: session.user.email || '',
        role: (session.user as any).role || 'GENERAL_USER',
        status: (session.user as any).status || 'ACTIVE',
      };
      return next();
    }
  } catch {
    // Ignore and fallback to JWT
  }

  const token =
    req.headers.authorization ||
    (req.cookies && (req.cookies.accessToken || req.cookies.token));

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

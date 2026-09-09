import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import { comparePassword, hashPassword } from '../../utils/passwordHelpers';
import { createToken, verifyToken } from '../../utils/jwtHelpers';
import { TChangePassword, TLoginUser } from './auth.interface';

const loginUser = async (payload: TLoginUser) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User does not exist!');
  }

  if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'User account is not active!');
  }

  const isPasswordMatched = await comparePassword(payload.password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Password does not match!');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwt_secret,
    config.jwt.jwt_expires_in
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.refresh_token_secret,
    config.jwt.refresh_token_expires_in
  );

  const { password: _, ...userData } = user;

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
};

const refreshToken = async (token: string) => {
  let verifiedToken: JwtPayload;

  try {
    verifiedToken = verifyToken(token, config.jwt.refresh_token_secret);
  } catch (err) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid refresh token!');
  }

  const user = await prisma.user.findUnique({
    where: {
      email: verifiedToken.email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'User account is not active!');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.jwt_secret,
    config.jwt.jwt_expires_in
  );

  return {
    accessToken,
  };
};

const changePassword = async (authUser: JwtPayload, payload: TChangePassword) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(authUser.userId),
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const isPasswordMatched = await comparePassword(payload.oldPassword, user.password);

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Old password does not match!');
  }

  const newHashedPassword = await hashPassword(payload.newPassword, config.bcrypt_salt_rounds);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: newHashedPassword,
    },
  });

  return {
    message: 'Password changed successfully!',
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email!');
  }

  if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'User account is not active!');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt.reset_pass_secret,
    config.jwt.reset_pass_expires_in
  );

  const resetLink = `${config.client_url}/reset-password?id=${user.id}&token=${resetToken}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #003824; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; color: #f6ad55;">RU Islamic Library</h2>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
      </div>
      <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
        <p>Assalamu Alaikum <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to choose a new password. This link is valid for <strong>5 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #003824; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset My Password
          </a>
        </div>

        <p style="font-size: 13px; color: #718096;">If you did not request this, you can safely ignore this email.</p>
        <p style="margin-top: 30px; font-size: 13px; color: #718096;">
          Jazakallahu Khair,<br />
          <strong>RU Islamic Library Team</strong>
        </p>
      </div>
    </div>
  `;

  const { sendEmail } = await import('../../utils/emailSender');
  await sendEmail({
    to: user.email,
    subject: '[RU Islamic Library] Reset Your Password',
    html: emailHtml,
    text: `Assalamu Alaikum ${user.name}, please reset your password using this link: ${resetLink}`,
  });

  return {
    message: 'Password reset link sent to your email successfully!',
  };
};

const resetPassword = async (
  token: string,
  payload: { id: number; newPassword: string }
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  let verifiedToken: JwtPayload;
  try {
    verifiedToken = verifyToken(token, config.jwt.reset_pass_secret);
  } catch (err) {
    throw new AppError(httpStatus.FORBIDDEN, 'Invalid or expired reset token!');
  }

  if (verifiedToken.userId !== user.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'Token does not match this user!');
  }

  const newHashedPassword = await hashPassword(payload.newPassword, config.bcrypt_salt_rounds);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: newHashedPassword,
    },
  });

  return {
    message: 'Password has been reset successfully!',
  };
};

export const AuthService = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};

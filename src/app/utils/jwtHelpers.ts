import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

export const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expireIn: string | number
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expireIn as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};

export default jwtHelpers;

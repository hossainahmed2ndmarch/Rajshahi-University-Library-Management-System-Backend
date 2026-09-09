import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        userId?: string;
        id?: string;
        email?: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}

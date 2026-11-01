import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, phoneNumber, jwt } from 'better-auth/plugins';
import prisma from './db';
import config from '../app/config';
import { sendSMS } from './sms';

const isProduction = process.env.NODE_ENV === 'production';

export const betterAuthInstance = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  // Must be the backend origin — no trailing slash
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  basePath: '/api/auth',
  // Use BETTER_AUTH_SECRET from env — never fall back to JWT secret in production
  secret: process.env.BETTER_AUTH_SECRET || config.jwt.jwt_secret || 'super-secure-better-auth-secret-key-2026',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'https://www.rudclibrary.com',
    'https://rudclibrary.com',
    config.client_url,
    process.env.BETTER_AUTH_URL,
  ].filter(Boolean) as string[],
  advanced: {
    // Required when running behind Render / Nginx reverse proxy (HTTPS)
    useSecureCookies: isProduction,
    // Fixes state_mismatch: ensures state cookie survives the Google → backend redirect
    defaultCookieAttributes: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
    },
    crossSubdomainCookies: {
      enabled: false,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      enabled: !!process.env.FACEBOOK_CLIENT_ID,
    },
  },
  plugins: [
    bearer(),
    jwt(),
    phoneNumber({
      sendOTP: async ({ phoneNumber: targetPhone, code }: { phoneNumber: string; code: string }) => {
        await sendSMS(targetPhone, `RU Islamic Library Verification Code: ${code}. Valid for 5 minutes.`);
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'GENERAL_USER',
      },
      status: {
        type: 'string',
        defaultValue: 'ACTIVE',
      },
      phone: {
        type: 'string',
        required: false,
      },
      avatarUrl: {
        type: 'string',
        required: false,
      },
      gender: {
        type: 'string',
        required: false,
      },
    },
  },
});

export default betterAuthInstance;

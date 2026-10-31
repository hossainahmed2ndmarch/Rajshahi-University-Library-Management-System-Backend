import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, phoneNumber, jwt } from 'better-auth/plugins';
import prisma from './db';
import config from '../app/config';
import { sendSMS } from './sms';

export const betterAuthInstance = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (config.backend_url
      ? config.backend_url.replace(/\/api\/v1\/?$/, '')
      : 'http://localhost:5000'),
  basePath: '/api/v1/auth',
  secret: config.jwt.jwt_secret || 'super-secure-better-auth-secret-key-2026',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'https://www.rudclibrary.com',
    'https://rudclibrary.com',
    config.client_url,
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? {
          facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    bearer(),
    jwt(),
    phoneNumber({
      sendOTP: async ({
        phoneNumber: targetPhone,
        code,
      }: {
        phoneNumber: string;
        code: string;
      }) => {
        await sendSMS(
          targetPhone,
          `RU Islamic Library Verification Code: ${code}. Valid for 5 minutes.`
        );
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
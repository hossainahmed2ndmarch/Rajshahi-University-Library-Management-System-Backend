"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.betterAuthInstance = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const plugins_1 = require("better-auth/plugins");
const db_1 = __importDefault(require("./db"));
const config_1 = __importDefault(require("../app/config"));
const sms_1 = require("./sms");
const isProduction = process.env.NODE_ENV === 'production';
exports.betterAuthInstance = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(db_1.default, {
        provider: 'postgresql',
    }),
    // Must be the backend origin — no trailing slash
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    basePath: '/api/auth',
    // Use BETTER_AUTH_SECRET from env — never fall back to JWT secret in production
    secret: process.env.BETTER_AUTH_SECRET || config_1.default.jwt.jwt_secret || 'super-secure-better-auth-secret-key-2026',
    trustedOrigins: [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'https://www.rudclibrary.com',
        'https://rudclibrary.com',
        config_1.default.client_url,
        process.env.BETTER_AUTH_URL,
    ].filter(Boolean),
    advanced: {
        // Required when running behind Render / Nginx reverse proxy (HTTPS)
        useSecureCookies: isProduction,
        // Fixes state_mismatch: ensures state cookie survives the Google → backend redirect
        defaultCookieAttributes: {
            secure: isProduction,
            httpOnly: true,
            sameSite: 'lax',
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
        (0, plugins_1.bearer)(),
        (0, plugins_1.jwt)(),
        (0, plugins_1.phoneNumber)({
            sendOTP: (_a) => __awaiter(void 0, [_a], void 0, function* ({ phoneNumber: targetPhone, code }) {
                yield (0, sms_1.sendSMS)(targetPhone, `RU Islamic Library Verification Code: ${code}. Valid for 5 minutes.`);
            }),
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
exports.default = exports.betterAuthInstance;

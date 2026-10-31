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
exports.optionalAuth = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const jwtHelpers_1 = require("../utils/jwtHelpers");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const db_1 = __importDefault(require("../../lib/db"));
const auth_1 = __importDefault(require("../../lib/auth"));
const node_1 = require("better-auth/node");
const auth = (...requiredRoles) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        let userId = null;
        let role = null;
        // 1. Try Better Auth Session first
        try {
            const session = yield auth_1.default.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
            });
            if (session && session.user) {
                userId = session.user.id;
                role = session.user.role || 'GENERAL_USER';
            }
        }
        catch (_c) {
            // Fall through to JWT token check
        }
        // 2. If no Better Auth session, fallback to Bearer / JWT Token
        if (!userId) {
            const authHeader = req.headers.authorization;
            const cookieToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) || ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.token);
            const rawToken = authHeader || cookieToken;
            if (!rawToken) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
            }
            const jwtToken = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;
            if (!jwtToken) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
            }
            try {
                const verifiedUser = (0, jwtHelpers_1.verifyToken)(jwtToken, config_1.default.jwt.jwt_secret);
                userId = String(verifiedUser.userId);
                role = verifiedUser.role;
            }
            catch (err) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized access!');
            }
        }
        if (!userId) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        // 3. Verify user in database
        const user = yield db_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, status: true, org: true },
        });
        if (!user) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'User no longer exists!');
        }
        if (user.status === 'BLOCKED') {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Your account has been suspended!');
        }
        if (user.status === 'INACTIVE' && user.org !== 'RUDC' && user.org !== 'BOTH') {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Your account is inactive!');
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
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden! You do not have permission to access this resource.');
        }
        next();
    }));
};
exports.optionalAuth = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield auth_1.default.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (session && session.user) {
            req.user = {
                userId: session.user.id,
                id: session.user.id,
                email: session.user.email || '',
                role: session.user.role || 'GENERAL_USER',
                status: session.user.status || 'ACTIVE',
            };
            return next();
        }
    }
    catch (_a) {
        // Ignore and fallback to JWT
    }
    const token = req.headers.authorization ||
        (req.cookies && (req.cookies.accessToken || req.cookies.token));
    if (token) {
        const jwtToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        if (jwtToken) {
            try {
                const verifiedUser = (0, jwtHelpers_1.verifyToken)(jwtToken, config_1.default.jwt.jwt_secret);
                req.user = verifiedUser;
            }
            catch (_b) {
                // Invalid or expired token - proceed as guest
            }
        }
    }
    next();
}));
exports.default = auth;

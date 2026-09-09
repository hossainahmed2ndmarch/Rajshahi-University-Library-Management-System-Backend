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
const auth = (...requiredRoles) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.headers.authorization;
        if (!token) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        const jwtToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        if (!jwtToken) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        let verifiedUser;
        try {
            verifiedUser = (0, jwtHelpers_1.verifyToken)(jwtToken, config_1.default.jwt.jwt_secret);
        }
        catch (err) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized access!');
        }
        // Verify user still exists and is not BLOCKED or INACTIVE
        const user = yield db_1.default.user.findUnique({
            where: { id: Number(verifiedUser.userId) },
            select: { id: true, email: true, role: true, status: true },
        });
        if (!user) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'User no longer exists!');
        }
        if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Your account is suspended or inactive!');
        }
        req.user = verifiedUser;
        if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden! You do not have permission to access this resource.');
        }
        next();
    }));
};
exports.optionalAuth = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.authorization;
    if (token) {
        const jwtToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        if (jwtToken) {
            try {
                const verifiedUser = (0, jwtHelpers_1.verifyToken)(jwtToken, config_1.default.jwt.jwt_secret);
                req.user = verifiedUser;
            }
            catch (_a) {
                // Invalid or expired token - proceed as guest
            }
        }
    }
    next();
}));
exports.default = auth;

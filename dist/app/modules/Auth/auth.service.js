"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const passwordHelpers_1 = require("../../utils/passwordHelpers");
const jwtHelpers_1 = require("../../utils/jwtHelpers");
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User does not exist!');
    }
    if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User account is not active!');
    }
    const isPasswordMatched = yield (0, passwordHelpers_1.comparePassword)(payload.password, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Password does not match!');
    }
    const jwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
    };
    const accessToken = (0, jwtHelpers_1.createToken)(jwtPayload, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expires_in);
    const refreshToken = (0, jwtHelpers_1.createToken)(jwtPayload, config_1.default.jwt.refresh_token_secret, config_1.default.jwt.refresh_token_expires_in);
    const { password: _ } = user, userData = __rest(user, ["password"]);
    return {
        accessToken,
        refreshToken,
        user: userData,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let verifiedToken;
    try {
        verifiedToken = (0, jwtHelpers_1.verifyToken)(token, config_1.default.jwt.refresh_token_secret);
    }
    catch (err) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid refresh token!');
    }
    const user = yield db_1.default.user.findUnique({
        where: {
            email: verifiedToken.email,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User account is not active!');
    }
    const jwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
    };
    const accessToken = (0, jwtHelpers_1.createToken)(jwtPayload, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expires_in);
    return {
        accessToken,
    };
});
const changePassword = (authUser, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: {
            id: Number(authUser.userId),
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const isPasswordMatched = yield (0, passwordHelpers_1.comparePassword)(payload.oldPassword, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Old password does not match!');
    }
    const newHashedPassword = yield (0, passwordHelpers_1.hashPassword)(payload.newPassword, config_1.default.bcrypt_salt_rounds);
    yield db_1.default.user.update({
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
});
const forgotPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'No user found with this email!');
    }
    if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'User account is not active!');
    }
    const jwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    const resetToken = (0, jwtHelpers_1.createToken)(jwtPayload, config_1.default.jwt.reset_pass_secret, config_1.default.jwt.reset_pass_expires_in);
    const resetLink = `${config_1.default.client_url}/reset-password?id=${user.id}&token=${resetToken}`;
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
    const { sendEmail } = yield Promise.resolve().then(() => __importStar(require('../../utils/emailSender')));
    yield sendEmail({
        to: user.email,
        subject: '[RU Islamic Library] Reset Your Password',
        html: emailHtml,
        text: `Assalamu Alaikum ${user.name}, please reset your password using this link: ${resetLink}`,
    });
    return {
        message: 'Password reset link sent to your email successfully!',
    };
});
const resetPassword = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: {
            id: payload.id,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    let verifiedToken;
    try {
        verifiedToken = (0, jwtHelpers_1.verifyToken)(token, config_1.default.jwt.reset_pass_secret);
    }
    catch (err) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Invalid or expired reset token!');
    }
    if (verifiedToken.userId !== user.id) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Token does not match this user!');
    }
    const newHashedPassword = yield (0, passwordHelpers_1.hashPassword)(payload.newPassword, config_1.default.bcrypt_salt_rounds);
    yield db_1.default.user.update({
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
});
exports.AuthService = {
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
};

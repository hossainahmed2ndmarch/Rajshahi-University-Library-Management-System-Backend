"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const zod_1 = require("zod");
const loginValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
const refreshTokenValidationSchema = zod_1.z.object({
    cookies: zod_1.z
        .object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    })
        .optional(),
    body: zod_1.z
        .object({
        refreshToken: zod_1.z.string().optional(),
    })
        .optional(),
});
const changePasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        oldPassword: zod_1.z.string().min(1, 'Old password is required'),
        newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
    }),
});
const forgotPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Valid email address is required'),
    }),
});
const resetPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        id: zod_1.z.number({ message: 'User ID is required' }),
        newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
    }),
});
exports.AuthValidation = {
    loginValidationSchema,
    refreshTokenValidationSchema,
    changePasswordValidationSchema,
    forgotPasswordValidationSchema,
    resetPasswordValidationSchema,
};

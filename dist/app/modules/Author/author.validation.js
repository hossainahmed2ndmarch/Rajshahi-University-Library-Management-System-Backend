"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorValidation = void 0;
const zod_1 = require("zod");
const createAuthorValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Author name is required'),
        avatar: zod_1.z.string().nullable().optional(),
        bio: zod_1.z.string().nullable().optional(),
        authorDesignation: zod_1.z.string().nullable().optional(),
        socialLinks: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).nullable().optional(),
        userId: zod_1.z.number().int().positive().nullable().optional(),
    }),
});
const updateAuthorValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        avatar: zod_1.z.string().nullable().optional(),
        bio: zod_1.z.string().nullable().optional(),
        authorDesignation: zod_1.z.string().nullable().optional(),
        socialLinks: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).nullable().optional(),
        userId: zod_1.z.number().int().positive().nullable().optional(),
    }),
});
exports.AuthorValidation = {
    createAuthorValidationSchema,
    updateAuthorValidationSchema,
};

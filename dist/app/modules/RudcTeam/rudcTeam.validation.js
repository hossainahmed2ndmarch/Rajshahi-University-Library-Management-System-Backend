"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcTeamValidation = void 0;
const zod_1 = require("zod");
const rudcTeamZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Team name is required'),
        description: zod_1.z.string().optional(),
    }),
});
const assignTeamMembersZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        teamId: zod_1.z.number(),
        userIds: zod_1.z.array(zod_1.z.number()).min(1, 'At least one user must be selected'),
        role: zod_1.z.string().optional().default('MEMBER'),
    }),
});
exports.RudcTeamValidation = {
    rudcTeamZodSchema,
    assignTeamMembersZodSchema,
};

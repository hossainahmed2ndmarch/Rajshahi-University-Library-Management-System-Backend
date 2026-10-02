"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcIyanotValidation = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const recordIyanotZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.number(),
        month: zod_1.z.number().min(1).max(12),
        year: zod_1.z.number().min(2020).max(2050),
        amount: zod_1.z.number().min(1).default(50),
        paymentMethod: zod_1.z.nativeEnum(client_1.IyanotPaymentMethod),
        collectedById: zod_1.z.number().optional(),
        transactionId: zod_1.z.string().optional(),
        remarks: zod_1.z.string().optional(),
    }),
});
exports.RudcIyanotValidation = {
    recordIyanotZodSchema,
};

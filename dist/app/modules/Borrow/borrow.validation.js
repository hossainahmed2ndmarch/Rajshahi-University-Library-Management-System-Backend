"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowValidation = void 0;
const zod_1 = require("zod");
const createBorrowValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookId: zod_1.z.number().int('Book ID must be an integer').positive('Book ID must be a positive integer'),
        userId: zod_1.z.number().int('User ID must be an integer').positive('User ID must be a positive integer').optional(),
        dueDate: zod_1.z.string().optional(),
    }),
});
const returnBorrowValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        returnNotes: zod_1.z.string().optional(),
        condition: zod_1.z.string().optional(),
        fineAmount: zod_1.z.number().min(0, 'Fine amount cannot be negative').optional(),
    }),
});
const issueBorrowValidationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        bookId: zod_1.z.number().int('Book ID must be an integer').positive('Book ID must be positive'),
        memberId: zod_1.z.number().int().positive().optional(),
        studentOrVoterId: zod_1.z.string().optional(),
        memberPhone: zod_1.z.string().optional(),
        memberEmail: zod_1.z.string().optional(),
        dueDate: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    })
        .refine((data) => data.memberId || data.studentOrVoterId || data.memberPhone || data.memberEmail, {
        message: 'Member identification (ID, Student/Voter Reg #, Phone, or Email) is required',
        path: ['memberId'],
    }),
});
exports.BorrowValidation = {
    createBorrowValidationSchema,
    issueBorrowValidationSchema,
    returnBorrowValidationSchema,
};

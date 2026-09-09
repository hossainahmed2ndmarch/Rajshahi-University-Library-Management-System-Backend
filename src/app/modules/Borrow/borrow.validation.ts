import { z } from 'zod';

const createBorrowValidationSchema = z.object({
  body: z.object({
    bookId: z.number().int('Book ID must be an integer').positive('Book ID must be a positive integer'),
    userId: z.number().int('User ID must be an integer').positive('User ID must be a positive integer').optional(),
    dueDate: z.string().optional(),
  }),
});

const returnBorrowValidationSchema = z.object({
  body: z.object({
    returnNotes: z.string().optional(),
    condition: z.string().optional(),
    fineAmount: z.number().min(0, 'Fine amount cannot be negative').optional(),
  }),
});

const issueBorrowValidationSchema = z.object({
  body: z
    .object({
      bookId: z.number().int('Book ID must be an integer').positive('Book ID must be positive'),
      memberId: z.number().int().positive().optional(),
      studentOrVoterId: z.string().optional(),
      memberPhone: z.string().optional(),
      memberEmail: z.string().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => data.memberId || data.studentOrVoterId || data.memberPhone || data.memberEmail, {
      message: 'Member identification (ID, Student/Voter Reg #, Phone, or Email) is required',
      path: ['memberId'],
    }),
});

export const BorrowValidation = {
  createBorrowValidationSchema,
  issueBorrowValidationSchema,
  returnBorrowValidationSchema,
};

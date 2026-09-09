import { BorrowStatus } from '@prisma/client';

export type TBorrowBook = {
  bookId: number;
  userId?: number;
  dueDate?: string | Date;
};

export type TReturnBook = {
  borrowId?: number;
  returnNotes?: string;
  condition?: string;
  fineAmount?: number;
};

export type TBorrowFilterRequest = {
  status?: BorrowStatus;
  userId?: number | string;
  overdue?: boolean | string;
  searchTerm?: string;
};

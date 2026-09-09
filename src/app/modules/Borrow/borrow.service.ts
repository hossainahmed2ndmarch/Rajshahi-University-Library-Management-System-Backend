import httpStatus from 'http-status';
import { BorrowStatus, BookType, UserRole, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import calculateDueDate from '../../utils/calculateDueDate';
import { sendOverdueAlert } from '../../utils/notificationSender';
import { TBorrowBook, TReturnBook } from './borrow.interface';

const MAX_ACTIVE_BORROWS_LIMIT = 5;

/**
 * 1. Request a Book Borrow
 * - Validates user membership status and expiry for ALL users (Member, Admin, Super Admin, Shifter)
 * - Checks active borrow count (Max 3 books allowed at a time)
 * - Checks book availability & type
 * - Creates a Borrow record with status 'PENDING'
 */
const createBorrowInDB = async (payload: TBorrowBook, userId: number) => {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Check user account status
  if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Your account status is ${user.status.toLowerCase().replace('_', ' ')}. Please contact library administration.`
    );
  }

  // Check membership expiry for MEMBER role (ADMIN, SUPER_ADMIN, SHIFTER bypass renewal fees)
  const now = new Date();
  if (user.role === UserRole.MEMBER) {
    if (
      user.status === UserStatus.PENDING_PAYMENT ||
      (user.membershipExpiresAt && user.membershipExpiresAt <= now)
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Your membership has expired or is pending payment. Please renew your membership to request book borrows.'
      );
    }
  }

  // Check active borrow count limit (max 5 books in PENDING, APPROVED, or OVERDUE status)
  const activeBorrowsCount = await prisma.borrow.count({
    where: {
      userId,
      status: {
        in: [BorrowStatus.PENDING, BorrowStatus.APPROVED, BorrowStatus.OVERDUE],
      },
    },
  });

  if (activeBorrowsCount >= MAX_ACTIVE_BORROWS_LIMIT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Borrow limit reached! You already have ${activeBorrowsCount} active/pending borrow(s). A member can borrow at most ${MAX_ACTIVE_BORROWS_LIMIT} books at a time. Please return your current books first.`
    );
  }

  // Validate book existence & availability
  const book = await prisma.book.findUnique({
    where: { id: payload.bookId },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found in library catalog!');
  }

  if (book.type === BookType.SELL_ONLY) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This book is marked for sale only and cannot be borrowed!');
  }

  if (book.borrowStock <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Book is currently out of stock for borrowing!');
  }

  // Check if user already has an active request or borrow for THIS EXACT book
  const existingActiveBorrowForBook = await prisma.borrow.findFirst({
    where: {
      userId,
      bookId: payload.bookId,
      status: {
        in: [BorrowStatus.PENDING, BorrowStatus.APPROVED, BorrowStatus.OVERDUE],
      },
    },
  });

  if (existingActiveBorrowForBook) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `You already have an active or pending borrow request for this book ("${book.title}").`
    );
  }

  // Create Borrow record in PENDING status
  // Note: Due date will be finalized and stock decremented upon Shifter/Admin approval
  const tentativeDueDate = calculateDueDate(book.pages, now);

  const borrowRecord = await prisma.borrow.create({
    data: {
      userId,
      bookId: payload.bookId,
      status: BorrowStatus.PENDING,
      requestedAt: now,
      dueDate: tentativeDueDate,
    },
    include: {
      book: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  return borrowRecord;
};

/**
 * 2. Approve Borrow Request by Shifter / Admin / Super Admin
 * - Verifies borrow is in PENDING status
 * - Decrements book borrow stock
 * - Automatically calculates Due Date based on book pages (15 pages = 1 day max) starting from approval time
 * - Sets status to APPROVED, approvedAt to now, and records approvedById
 */
const approveBorrowInDB = async (borrowId: number, approvedById?: number) => {
  const borrow = await prisma.borrow.findUnique({
    where: { id: borrowId },
    include: {
      book: true,
      user: true,
    },
  });

  if (!borrow) {
    throw new AppError(httpStatus.NOT_FOUND, 'Borrow request not found!');
  }

  if (borrow.status === BorrowStatus.APPROVED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This borrow request is already approved!');
  }

  if (borrow.status === BorrowStatus.RETURNED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot approve a record that is already returned!');
  }

  if (borrow.book.borrowStock <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot approve request. "${borrow.book.title}" is out of stock!`
    );
  }

  // Check membership status at the time of approval for MEMBER role
  const now = new Date();
  if (borrow.user.role === UserRole.MEMBER && borrow.user.membershipExpiresAt && borrow.user.membershipExpiresAt <= now) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Cannot approve borrow: Member's membership expired on ${borrow.user.membershipExpiresAt.toLocaleDateString()}. Member must renew first.`
    );
  }

  // Calculate automatic due date: 15 pages per day
  const calculatedDueDate = calculateDueDate(borrow.book.pages, now);

  // Execute in transaction: decrement stock and update status
  const updatedBorrow = await prisma.$transaction(async (tx) => {
    await tx.book.update({
      where: { id: borrow.bookId },
      data: {
        borrowStock: {
          decrement: 1,
        },
      },
    });

    const approved = await tx.borrow.update({
      where: { id: borrowId },
      data: {
        status: BorrowStatus.APPROVED,
        approvedAt: now,
        approvedById: approvedById || null,
        dueDate: calculatedDueDate,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return approved;
  });

  return updatedBorrow;
};

/**
 * 3. Reject Borrow Request
 */
const rejectBorrowInDB = async (borrowId: number) => {
  const borrow = await prisma.borrow.findUnique({
    where: { id: borrowId },
  });

  if (!borrow) {
    throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found!');
  }

  if (borrow.status === BorrowStatus.REJECTED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Borrow record is already rejected!');
  }

  // If it was already approved earlier, restore inventory
  if (borrow.status === BorrowStatus.APPROVED || borrow.status === BorrowStatus.OVERDUE) {
    return await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: borrow.bookId },
        data: {
          borrowStock: {
            increment: 1,
          },
        },
      });

      return await tx.borrow.update({
        where: { id: borrowId },
        data: {
          status: BorrowStatus.REJECTED,
        },
        include: {
          book: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  // For PENDING status, just mark REJECTED (stock was not decremented)
  const updatedBorrow = await prisma.borrow.update({
    where: { id: borrowId },
    data: {
      status: BorrowStatus.REJECTED,
    },
    include: {
      book: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedBorrow;
};

/**
 * 4. Return Borrowed Book
 */
const returnBookInDB = async (borrowId: number, returnedById: number, payload?: TReturnBook) => {
  const borrow = await prisma.borrow.findUnique({
    where: { id: borrowId },
  });

  if (!borrow) {
    throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found!');
  }

  if (borrow.status === BorrowStatus.RETURNED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Book has already been returned!');
  }

  if (borrow.status === BorrowStatus.PENDING || borrow.status === BorrowStatus.REJECTED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot return a pending or rejected borrow request!');
  }

  // Increment stock and mark RETURNED
  const result = await prisma.$transaction(async (tx) => {
    await tx.book.update({
      where: { id: borrow.bookId },
      data: {
        borrowStock: {
          increment: 1,
        },
      },
    });

    const updatedBorrow = await tx.borrow.update({
      where: { id: borrowId },
      data: {
        status: BorrowStatus.RETURNED,
        returnedAt: new Date(),
        returnedById: returnedById,
        fineAmount: payload?.fineAmount ?? 0,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        returnedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return updatedBorrow;
  });

  return result;
};

/**
 * 5. Direct Issue Book by Shifter / Admin (Immediate approval at Counter Desk)
 * Supports members who walk in without phone or internet
 */
const issueBookDirectlyInDB = async (
  payload: {
    bookId: number;
    memberId?: number;
    studentOrVoterId?: string;
    memberPhone?: string;
    memberEmail?: string;
    dueDate?: string;
    notes?: string;
  },
  shifterId: number
) => {
  let user = null;

  if (payload.memberId && !isNaN(Number(payload.memberId))) {
    user = await prisma.user.findUnique({
      where: { id: Number(payload.memberId) },
    });
  }

  if (!user) {
    const identifier = (
      payload.studentOrVoterId ||
      payload.memberPhone ||
      payload.memberEmail ||
      ''
    ).trim();

    if (identifier) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { studentOrVoterId: identifier },
            { phone: identifier },
            { email: identifier },
          ],
        },
      });
    }
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'Member not found with the provided details!');
  }

  const now = new Date();
  if (
    !user.isPaid ||
    user.status === UserStatus.BLOCKED ||
    user.status === UserStatus.INACTIVE ||
    (user.membershipExpiresAt && user.membershipExpiresAt <= now)
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `Cannot issue book: Member's account is ${user.status.toLowerCase().replace('_', ' ')} or validity has expired.`
    );
  }

  // Check active borrows limit
  const activeCount = await prisma.borrow.count({
    where: {
      userId: user.id,
      status: {
        in: [BorrowStatus.PENDING, BorrowStatus.APPROVED, BorrowStatus.OVERDUE],
      },
    },
  });

  if (activeCount >= MAX_ACTIVE_BORROWS_LIMIT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot issue book: Member already has ${activeCount} active borrows (Max ${MAX_ACTIVE_BORROWS_LIMIT}).`
    );
  }

  const book = await prisma.book.findUnique({
    where: { id: payload.bookId },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found in library catalog!');
  }

  if (book.type === BookType.SELL_ONLY) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Book is marked for sale only and cannot be borrowed!');
  }

  if (book.borrowStock <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, `"${book.title}" is currently out of stock for borrowing!`);
  }

  // Check if member already has this exact book borrowed
  const existingActiveBorrowForBook = await prisma.borrow.findFirst({
    where: {
      userId: user.id,
      bookId: payload.bookId,
      status: {
        in: [BorrowStatus.PENDING, BorrowStatus.APPROVED, BorrowStatus.OVERDUE],
      },
    },
  });

  if (existingActiveBorrowForBook) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Member "${user.name}" already has an active borrow for "${book.title}".`
    );
  }

  const calculatedDueDate = payload.dueDate
    ? new Date(payload.dueDate)
    : calculateDueDate(book.pages, now);

  const result = await prisma.$transaction(async (tx) => {
    await tx.book.update({
      where: { id: payload.bookId },
      data: {
        borrowStock: {
          decrement: 1,
        },
      },
    });

    const borrow = await tx.borrow.create({
      data: {
        userId: user.id,
        bookId: payload.bookId,
        approvedById: shifterId,
        approvedAt: now,
        dueDate: calculatedDueDate,
        status: BorrowStatus.APPROVED,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            studentOrVoterId: true,
            department: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return borrow;
  });

  return result;
};

/**
 * 6. Get Borrows with Filters and Pagination
 */
const getAllBorrowsFromDB = async (
  query: Record<string, unknown>,
  user: { userId: number; role: string }
) => {
  const { overdue, ...queryParams } = query;
  queryParams.limit = queryParams.limit ? Number(queryParams.limit) : 100;

  if (user.role === UserRole.MEMBER || queryParams.userId) {
    queryParams.userId = queryParams.userId ? Number(queryParams.userId) : user.userId;
  }

  const borrowQuery = new QueryBuilder(prisma.borrow, queryParams, {
    searchableFields: ['book.title', 'book.author', 'user.name', 'user.email'],
    filterableFields: ['status', 'userId', 'bookId'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      book: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      returnedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    });

  if (overdue === 'true' || overdue === true) {
    borrowQuery.where({
      dueDate: {
        lt: new Date(),
      },
      status: {
        not: BorrowStatus.RETURNED,
      },
    });
  }

  return await borrowQuery.execute();
};

/**
 * 7. Check Overdue Borrows and Dispatch Warning Notifications (Email + Mobile)
 */
const checkOverdueBorrowsAndNotify = async () => {
  const now = new Date();

  // Find all borrows where dueDate has passed and status is APPROVED (or OVERDUE) and not RETURNED
  const overdueBorrows = await prisma.borrow.findMany({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        in: [BorrowStatus.APPROVED],
      },
    },
    include: {
      book: true,
      user: true,
    },
  });

  const processed: Array<{ borrowId: number; user: string; book: string }> = [];

  for (const borrow of overdueBorrows) {
    // 1. Mark status as OVERDUE
    await prisma.borrow.update({
      where: { id: borrow.id },
      data: {
        status: BorrowStatus.OVERDUE,
      },
    });

    // 2. Dispatch email & SMS warning notifications
    if (borrow.user && borrow.dueDate) {
      await sendOverdueAlert({
        userName: borrow.user.name,
        userEmail: borrow.user.email,
        userPhone: borrow.user.phone,
        bookTitle: borrow.book.title,
        dueDate: borrow.dueDate,
        borrowId: borrow.id,
      });
    }

    processed.push({
      borrowId: borrow.id,
      user: borrow.user.name,
      book: borrow.book.title,
    });
  }

  return {
    totalChecked: overdueBorrows.length,
    overdueList: processed,
  };
};

const deleteBorrowInDB = async (borrowId: number) => {
  const borrow = await prisma.borrow.findUnique({
    where: { id: borrowId },
  });

  if (!borrow) {
    throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found!');
  }

  // If borrow is currently approved or overdue, restore book borrowStock before deletion
  if (borrow.status === BorrowStatus.APPROVED || borrow.status === BorrowStatus.OVERDUE) {
    return await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: borrow.bookId },
        data: {
          borrowStock: {
            increment: 1,
          },
        },
      });

      return await tx.borrow.delete({
        where: { id: borrowId },
      });
    });
  }

  return await prisma.borrow.delete({
    where: { id: borrowId },
  });
};

export const BorrowService = {
  createBorrowInDB,
  approveBorrowInDB,
  rejectBorrowInDB,
  returnBookInDB,
  issueBookDirectlyInDB,
  getAllBorrowsFromDB,
  checkOverdueBorrowsAndNotify,
  deleteBorrowInDB,
};


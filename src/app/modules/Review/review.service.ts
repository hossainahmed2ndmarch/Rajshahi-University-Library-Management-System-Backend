import httpStatus from 'http-status';
import { UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import { TCreateBookReview, TCreateServiceReview } from './review.interface';

const createBookReviewInDB = async (
  payload: TCreateBookReview,
  userId?: number,
  userRole?: string
) => {
  const book = await prisma.book.findUnique({
    where: { id: payload.bookId },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found!');
  }

  // 1. Borrowable books: Only MEMBER, SHIFTER, ADMIN, and SUPER_ADMIN can review and rate
  if (book.type === 'BORROW_ONLY') {
    if (!userId || !userRole) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Borrowable books can only be reviewed and rated by registered members, shifters, admins, and super admins. Please log in to submit your review.'
      );
    }

    const allowedRoles = ['MEMBER', 'SHIFTER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(userRole)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only registered library members and staff are authorized to review borrowable books.'
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User account not found!');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden! Only active members can submit reviews.');
    }

    const existingReview = await prisma.bookReview.findFirst({
      where: { userId, bookId: payload.bookId },
    });

    if (existingReview) {
      return await prisma.bookReview.update({
        where: { id: existingReview.id },
        data: {
          rating: payload.rating,
          comment: payload.comment || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              type: true,
            },
          },
        },
      });
    }

    return await prisma.bookReview.create({
      data: {
        userId,
        bookId: payload.bookId,
        rating: payload.rating,
        comment: payload.comment || null,
        reviewerName: user.name,
        reviewerEmail: user.email,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            type: true,
          },
        },
      },
    });
  }

  // 2. Buyable (SELL_ONLY) and Hybrid (HYBRID) books: Any type of user can review and rate
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User account not found!');
    }

    const existingReview = await prisma.bookReview.findFirst({
      where: { userId, bookId: payload.bookId },
    });

    if (existingReview) {
      return await prisma.bookReview.update({
        where: { id: existingReview.id },
        data: {
          rating: payload.rating,
          comment: payload.comment || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              type: true,
            },
          },
        },
      });
    }

    return await prisma.bookReview.create({
      data: {
        userId,
        bookId: payload.bookId,
        rating: payload.rating,
        comment: payload.comment || null,
        reviewerName: user.name,
        reviewerEmail: user.email,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            type: true,
          },
        },
      },
    });
  } else {
    // Guest reviewer
    return await prisma.bookReview.create({
      data: {
        userId: null,
        bookId: payload.bookId,
        rating: payload.rating,
        comment: payload.comment || null,
        reviewerName: payload.reviewerName || 'Guest Reviewer',
        reviewerEmail: payload.reviewerEmail || null,
        isAnonymous: payload.isAnonymous || false,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            type: true,
          },
        },
      },
    });
  }
};

const createServiceReviewInDB = async (payload: TCreateServiceReview, userId?: number) => {
  return await prisma.serviceReview.create({
    data: {
      rating: payload.rating,
      comment: payload.comment || null,
      isAnonymous: payload.isAnonymous || false,
      userId: userId || null,
      reviewerName: payload.reviewerName || null,
      reviewerEmail: payload.reviewerEmail || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const getServiceReviewsFromDB = async () => {
  const reviews = await prisma.serviceReview.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
      : 0;

  return {
    totalReviews,
    averageRating,
    reviews,
  };
};

const getBookReviewsFromDB = async (bookId: number) => {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, 'Book not found!');
  }

  const reviews = await prisma.bookReview.findMany({
    where: { bookId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
      : 0;

  return {
    bookId,
    totalReviews,
    averageRating,
    reviews,
  };
};

const updateBookReviewInDB = async (
  reviewId: number,
  payload: { rating?: number; comment?: string },
  requestingUser: { userId: number; role: string }
) => {
  const review = await prisma.bookReview.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
  }

  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(requestingUser.role);
  if (review.userId !== requestingUser.userId && !isStaff) {
    throw new AppError(httpStatus.FORBIDDEN, 'Forbidden! You can only update your own review.');
  }

  return await prisma.bookReview.update({
    where: { id: reviewId },
    data: {
      ...(payload.rating !== undefined && { rating: payload.rating }),
      ...(payload.comment !== undefined && { comment: payload.comment }),
    },
  });
};

const getAllReviewsFromDB = async () => {
  const [bookReviews, serviceReviews] = await Promise.all([
    prisma.bookReview.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.serviceReview.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    totalBookReviews: bookReviews.length,
    totalServiceReviews: serviceReviews.length,
    bookReviews,
    serviceReviews,
  };
};

const deleteReviewInDB = async (
  reviewId: number,
  requestingUser: { userId: number; role: string }
) => {
  const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(requestingUser.role);

  const bookReview = await prisma.bookReview.findUnique({
    where: { id: reviewId },
  });

  if (bookReview) {
    if (bookReview.userId !== requestingUser.userId && !isStaff) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden! You can only delete your own review.');
    }
    return await prisma.bookReview.delete({
      where: { id: reviewId },
    });
  }

  const serviceReview = await prisma.serviceReview.findUnique({
    where: { id: reviewId },
  });

  if (serviceReview) {
    if (serviceReview.userId !== requestingUser.userId && !isStaff) {
      throw new AppError(httpStatus.FORBIDDEN, 'Forbidden! You can only delete your own review.');
    }
    return await prisma.serviceReview.delete({
      where: { id: reviewId },
    });
  }

  throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
};

export const ReviewService = {
  createBookReviewInDB,
  createServiceReviewInDB,
  getServiceReviewsFromDB,
  getBookReviewsFromDB,
  getAllReviewsFromDB,
  updateBookReviewInDB,
  deleteBookReviewInDB: deleteReviewInDB,
  deleteReviewInDB,
};


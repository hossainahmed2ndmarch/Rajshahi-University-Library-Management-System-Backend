"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const createBookReviewInDB = (payload, userId, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id: payload.bookId },
    });
    if (!book) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    // 1. Borrowable books: Only MEMBER, SHIFTER, ADMIN, and SUPER_ADMIN can review and rate
    if (book.type === 'BORROW_ONLY') {
        if (!userId || !userRole) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Borrowable books can only be reviewed and rated by registered members, shifters, admins, and super admins. Please log in to submit your review.');
        }
        const allowedRoles = ['MEMBER', 'SHIFTER', 'ADMIN', 'SUPER_ADMIN'];
        if (!allowedRoles.includes(userRole)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Only registered library members and staff are authorized to review borrowable books.');
        }
        const user = yield db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User account not found!');
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden! Only active members can submit reviews.');
        }
        const existingReview = yield db_1.default.bookReview.findFirst({
            where: { userId, bookId: payload.bookId },
        });
        if (existingReview) {
            return yield db_1.default.bookReview.update({
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
        return yield db_1.default.bookReview.create({
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
        const user = yield db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User account not found!');
        }
        const existingReview = yield db_1.default.bookReview.findFirst({
            where: { userId, bookId: payload.bookId },
        });
        if (existingReview) {
            return yield db_1.default.bookReview.update({
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
        return yield db_1.default.bookReview.create({
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
    else {
        // Guest reviewer
        return yield db_1.default.bookReview.create({
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
});
const createServiceReviewInDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.serviceReview.create({
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
});
const getServiceReviewsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield db_1.default.serviceReview.findMany({
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
    const averageRating = totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
        : 0;
    return {
        totalReviews,
        averageRating,
        reviews,
    };
});
const getBookReviewsFromDB = (bookId) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id: bookId },
    });
    if (!book) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    const reviews = yield db_1.default.bookReview.findMany({
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
    const averageRating = totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
        : 0;
    return {
        bookId,
        totalReviews,
        averageRating,
        reviews,
    };
});
const updateBookReviewInDB = (reviewId, payload, requestingUser) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield db_1.default.bookReview.findUnique({
        where: { id: reviewId },
    });
    if (!review) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Review not found!');
    }
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(requestingUser.role);
    if (review.userId !== requestingUser.userId && !isStaff) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden! You can only update your own review.');
    }
    return yield db_1.default.bookReview.update({
        where: { id: reviewId },
        data: Object.assign(Object.assign({}, (payload.rating !== undefined && { rating: payload.rating })), (payload.comment !== undefined && { comment: payload.comment })),
    });
});
const getAllReviewsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const [bookReviews, serviceReviews] = yield Promise.all([
        db_1.default.bookReview.findMany({
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
        db_1.default.serviceReview.findMany({
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
});
const deleteReviewInDB = (reviewId, requestingUser) => __awaiter(void 0, void 0, void 0, function* () {
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(requestingUser.role);
    const bookReview = yield db_1.default.bookReview.findUnique({
        where: { id: reviewId },
    });
    if (bookReview) {
        if (bookReview.userId !== requestingUser.userId && !isStaff) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden! You can only delete your own review.');
        }
        return yield db_1.default.bookReview.delete({
            where: { id: reviewId },
        });
    }
    const serviceReview = yield db_1.default.serviceReview.findUnique({
        where: { id: reviewId },
    });
    if (serviceReview) {
        if (serviceReview.userId !== requestingUser.userId && !isStaff) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden! You can only delete your own review.');
        }
        return yield db_1.default.serviceReview.delete({
            where: { id: reviewId },
        });
    }
    throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Review not found!');
});
exports.ReviewService = {
    createBookReviewInDB,
    createServiceReviewInDB,
    getServiceReviewsFromDB,
    getBookReviewsFromDB,
    getAllReviewsFromDB,
    updateBookReviewInDB,
    deleteBookReviewInDB: deleteReviewInDB,
    deleteReviewInDB,
};

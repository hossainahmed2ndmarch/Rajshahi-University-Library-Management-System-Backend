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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const createBookIntoDB = (payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingIsbn = yield db_1.default.book.findUnique({
        where: { isbn: payload.isbn },
    });
    if (existingIsbn) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A book with this ISBN already exists!');
    }
    const bookData = Object.assign(Object.assign({}, payload), { addedById: adminId || null });
    return yield db_1.default.book.create({
        data: bookData,
    });
});
const getAllBooksFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { isBorrowable, isSellable, sortBy, sortOrder = 'desc', isArchived } = query, queryParams = __rest(query, ["isBorrowable", "isSellable", "sortBy", "sortOrder", "isArchived"]);
    // Set up QueryBuilder with searchable and filterable fields
    // Default isArchived to false so deleted/archived books are hidden from regular listings
    const bookQuery = new queryBuilder_1.default(db_1.default.book, Object.assign(Object.assign({}, queryParams), { isArchived: isArchived !== null && isArchived !== void 0 ? isArchived : false }), {
        searchableFields: ['title', 'author', 'isbn', 'category', 'publisher', 'locationCell', 'description'],
        filterableFields: ['category', 'author', 'type', 'isArchived', 'publisher'],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    // Filter for borrowable books (BORROW_ONLY or HYBRID)
    if (isBorrowable === 'true' || isBorrowable === true) {
        bookQuery.where({
            type: {
                in: [client_1.BookType.BORROW_ONLY, client_1.BookType.HYBRID],
            },
        });
    }
    // Filter for sellable books (SELL_ONLY or HYBRID)
    if (isSellable === 'true' || isSellable === true) {
        bookQuery.where({
            type: {
                in: [client_1.BookType.SELL_ONLY, client_1.BookType.HYBRID],
            },
        });
    }
    // Custom Sorting Logic
    if (sortBy === 'createdAt') {
        // 1. New Arrivals: Sort by creation timestamp
        bookQuery.orderBy({
            createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
        });
    }
    else if (sortBy === 'borrowCount') {
        // 2. Most Borrowed: Sort by relation count on borrowRecords table
        bookQuery.orderBy({
            borrowRecords: {
                _count: sortOrder === 'asc' ? 'asc' : 'desc',
            },
        });
    }
    else if (sortBy) {
        // 3. Generic field sorting
        bookQuery.orderBy({
            [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
        });
    }
    else {
        // Default fallback: Newest first
        bookQuery.orderBy({
            createdAt: 'desc',
        });
    }
    return yield bookQuery.execute();
});
const getBookByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id },
        include: {
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            addedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            donatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    if (!book) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    const totalReviews = book.reviews.length;
    const averageRating = totalReviews > 0
        ? Number((book.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews).toFixed(2))
        : 0;
    return Object.assign(Object.assign({}, book), { reviewSummary: {
            totalReviews,
            averageRating,
        } });
});
const updateBookInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id },
    });
    if (!book) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    if (payload.isbn && payload.isbn !== book.isbn) {
        const existingIsbn = yield db_1.default.book.findUnique({
            where: { isbn: payload.isbn },
        });
        if (existingIsbn) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A book with this ISBN already exists!');
        }
    }
    const updateData = {};
    if (payload.title !== undefined)
        updateData.title = payload.title;
    if (payload.author !== undefined)
        updateData.author = payload.author;
    if (payload.isbn !== undefined)
        updateData.isbn = payload.isbn;
    if (payload.locationCell !== undefined)
        updateData.locationCell = payload.locationCell;
    if (payload.category !== undefined)
        updateData.category = payload.category;
    if (payload.publisher !== undefined)
        updateData.publisher = payload.publisher;
    if (payload.pages !== undefined)
        updateData.pages = Number(payload.pages);
    if (payload.type !== undefined)
        updateData.type = payload.type;
    if (payload.buyPrice !== undefined)
        updateData.buyPrice = payload.buyPrice !== null ? Number(payload.buyPrice) : null;
    if (payload.sellPrice !== undefined)
        updateData.sellPrice = payload.sellPrice !== null ? Number(payload.sellPrice) : null;
    if (payload.discount !== undefined)
        updateData.discount = Number(payload.discount);
    if (payload.borrowStock !== undefined)
        updateData.borrowStock = Number(payload.borrowStock);
    if (payload.sellStock !== undefined)
        updateData.sellStock = Number(payload.sellStock);
    if (payload.coverImage !== undefined)
        updateData.coverImage = payload.coverImage;
    if (payload.images !== undefined)
        updateData.images = payload.images;
    if (payload.description !== undefined)
        updateData.description = payload.description;
    if (payload.isArchived !== undefined)
        updateData.isArchived = Boolean(payload.isArchived);
    return yield db_1.default.book.update({
        where: { id },
        data: updateData,
    });
});
const deleteBookFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id },
    });
    if (!book) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    // Hard delete: permanently remove the book record
    return yield db_1.default.book.delete({
        where: { id },
    });
});
const getBookCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield db_1.default.book.groupBy({
        by: ['category'],
        where: { isArchived: false },
        _count: {
            id: true,
        },
        orderBy: {
            _count: {
                id: 'desc',
            },
        },
    });
    const categoriesWithBooks = yield Promise.all(categories.map((c) => __awaiter(void 0, void 0, void 0, function* () {
        const books = yield db_1.default.book.findMany({
            where: {
                category: c.category,
                isArchived: false,
            },
            select: {
                id: true,
                title: true,
                coverImage: true,
                author: true,
            },
            take: 4,
            orderBy: {
                createdAt: 'desc',
            },
        });
        return {
            category: c.category,
            count: c._count.id,
            books,
        };
    })));
    return categoriesWithBooks;
});
exports.BookService = {
    createBookIntoDB,
    getAllBooksFromDB,
    getBookByIdFromDB,
    getBookCategoriesFromDB,
    updateBookInDB,
    deleteBookFromDB,
};

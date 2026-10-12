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
exports.BookService = exports.formatBookResponse = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const formatBookResponse = (book) => {
    var _a, _b, _c;
    if (!book)
        return book;
    const authorNames = Array.isArray(book.authors)
        ? book.authors.map((ba) => { var _a; return ((_a = ba.author) === null || _a === void 0 ? void 0 : _a.name) || ba.name; }).filter(Boolean).join(', ')
        : '';
    const effectiveDiscount = book.customDiscount !== null && book.customDiscount !== undefined
        ? Number(book.customDiscount)
        : ((_a = book.publisher) === null || _a === void 0 ? void 0 : _a.defaultDiscount) !== null && ((_b = book.publisher) === null || _b === void 0 ? void 0 : _b.defaultDiscount) !== undefined
            ? Number(book.publisher.defaultDiscount)
            : 0;
    return Object.assign(Object.assign({}, book), { author: authorNames || book.author || 'Unknown Author', publisher: ((_c = book.publisher) === null || _c === void 0 ? void 0 : _c.name) || null, publisherDetails: book.publisher || null, discount: effectiveDiscount });
};
exports.formatBookResponse = formatBookResponse;
const resolvePublisherId = (publisherId, publisherName) => __awaiter(void 0, void 0, void 0, function* () {
    if (publisherId) {
        const pub = yield db_1.default.publisher.findUnique({ where: { id: publisherId } });
        if (pub)
            return pub.id;
    }
    if (publisherName && publisherName.trim()) {
        const trimmed = publisherName.trim();
        const existing = yield db_1.default.publisher.findUnique({ where: { name: trimmed } });
        if (existing)
            return existing.id;
        const created = yield db_1.default.publisher.create({ data: { name: trimmed } });
        return created.id;
    }
    return null;
});
const resolveAuthorItems = (authors, authorStr) => __awaiter(void 0, void 0, void 0, function* () {
    const result = [];
    if (Array.isArray(authors) && authors.length > 0) {
        for (const item of authors) {
            if (item.authorId) {
                result.push({ authorId: item.authorId, role: item.role || 'WRITER' });
            }
            else if (item.name && item.name.trim()) {
                const trimmed = item.name.trim();
                let author = yield db_1.default.author.findFirst({ where: { name: trimmed } });
                if (!author) {
                    author = yield db_1.default.author.create({ data: { name: trimmed } });
                }
                result.push({ authorId: author.id, role: item.role || 'WRITER' });
            }
        }
    }
    else if (authorStr && authorStr.trim()) {
        const splitNames = authorStr.split(',').map((s) => s.trim()).filter(Boolean);
        for (const name of splitNames) {
            let author = yield db_1.default.author.findFirst({ where: { name } });
            if (!author) {
                author = yield db_1.default.author.create({ data: { name } });
            }
            result.push({ authorId: author.id, role: 'WRITER' });
        }
    }
    return result;
});
const createBookIntoDB = (payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingIsbn = yield db_1.default.book.findUnique({
        where: { isbn: payload.isbn },
    });
    if (existingIsbn) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A book with this ISBN already exists!');
    }
    // Handle multiple categories
    let categories = [];
    if (Array.isArray(payload.categories) && payload.categories.length > 0) {
        categories = Array.from(new Set(payload.categories.map((c) => c.trim()).filter(Boolean)));
    }
    else if (payload.category) {
        categories = payload.category
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
    }
    const categoryStr = categories.length > 0 ? categories.join(', ') : payload.category || 'General';
    const publisherId = yield resolvePublisherId(payload.publisherId, payload.publisher);
    const resolvedAuthors = yield resolveAuthorItems(payload.authors, payload.author);
    const customDiscountValue = payload.customDiscount !== undefined && payload.customDiscount !== null
        ? payload.customDiscount
        : payload.discount !== undefined && payload.discount !== null
            ? payload.discount
            : null;
    const book = yield db_1.default.book.create({
        data: {
            title: payload.title,
            isbn: payload.isbn,
            locationCell: payload.locationCell,
            category: categoryStr,
            categories,
            pages: payload.pages !== undefined ? Number(payload.pages) : null,
            type: payload.type,
            buyPrice: payload.buyPrice !== undefined && payload.buyPrice !== null ? payload.buyPrice : null,
            sellPrice: payload.sellPrice !== undefined && payload.sellPrice !== null ? payload.sellPrice : null,
            customDiscount: customDiscountValue,
            borrowStock: payload.borrowStock !== undefined ? Number(payload.borrowStock) : 0,
            sellStock: payload.sellStock !== undefined ? Number(payload.sellStock) : 0,
            coverImage: payload.coverImage || null,
            images: payload.images || [],
            description: payload.description || null,
            addedById: adminId || null,
            donatedById: payload.donatedById || null,
            publisherId,
            authors: {
                create: resolvedAuthors.map((a) => ({
                    authorId: a.authorId,
                    role: a.role,
                })),
            },
        },
        include: {
            publisher: true,
            authors: {
                include: {
                    author: true,
                },
            },
        },
    });
    return (0, exports.formatBookResponse)(book);
});
const getAllBooksFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { isBorrowable, isSellable, sortBy, sortOrder = 'desc', isArchived, category, categories, author, authors, authorId, publisher, publishers, publisherId, type, minPrice, maxPrice } = query, queryParams = __rest(query, ["isBorrowable", "isSellable", "sortBy", "sortOrder", "isArchived", "category", "categories", "author", "authors", "authorId", "publisher", "publishers", "publisherId", "type", "minPrice", "maxPrice"]);
    const bookQuery = new queryBuilder_1.default(db_1.default.book, Object.assign(Object.assign({}, queryParams), { isArchived: isArchived !== null && isArchived !== void 0 ? isArchived : false }), {
        searchableFields: ['title', 'isbn', 'category', 'locationCell', 'description'],
        filterableFields: ['isArchived'],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    // Search in related author name or publisher name if searchTerm provided
    if (queryParams.searchTerm) {
        const term = String(queryParams.searchTerm).trim();
        bookQuery.where({
            OR: [
                { title: { contains: term, mode: 'insensitive' } },
                { isbn: { contains: term, mode: 'insensitive' } },
                { locationCell: { contains: term, mode: 'insensitive' } },
                { category: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                {
                    authors: {
                        some: {
                            author: {
                                name: { contains: term, mode: 'insensitive' },
                            },
                        },
                    },
                },
                {
                    publisher: {
                        name: { contains: term, mode: 'insensitive' },
                    },
                },
            ],
        });
    }
    // ── Category filter ────────────────────────────────────────────────────────
    const rawCategory = category !== null && category !== void 0 ? category : categories;
    if (rawCategory) {
        const categoryValues = Array.isArray(rawCategory)
            ? rawCategory.flatMap((c) => c.split(',')).map((c) => c.trim()).filter(Boolean)
            : typeof rawCategory === 'string' && rawCategory !== 'ALL'
                ? rawCategory.split(',').map((c) => c.trim()).filter(Boolean)
                : [];
        if (categoryValues.length === 1) {
            bookQuery.where({
                OR: [
                    { categories: { has: categoryValues[0] } },
                    { category: { contains: categoryValues[0], mode: 'insensitive' } },
                ],
            });
        }
        else if (categoryValues.length > 1) {
            bookQuery.where({
                OR: categoryValues.flatMap((cat) => [
                    { categories: { has: cat } },
                    { category: { contains: cat, mode: 'insensitive' } },
                ]),
            });
        }
    }
    // ── Author filter ──────────────────────────────────────────────────────────
    const rawAuthor = author !== null && author !== void 0 ? author : authors;
    if (rawAuthor) {
        const authorValues = Array.isArray(rawAuthor)
            ? rawAuthor.flatMap((a) => a.split(',')).map((a) => a.trim()).filter(Boolean)
            : typeof rawAuthor === 'string'
                ? rawAuthor.split(',').map((a) => a.trim()).filter(Boolean)
                : [];
        if (authorValues.length === 1) {
            bookQuery.where({
                authors: {
                    some: {
                        author: {
                            name: { contains: authorValues[0], mode: 'insensitive' },
                        },
                    },
                },
            });
        }
        else if (authorValues.length > 1) {
            bookQuery.where({
                OR: authorValues.map((a) => ({
                    authors: {
                        some: {
                            author: {
                                name: { contains: a, mode: 'insensitive' },
                            },
                        },
                    },
                })),
            });
        }
    }
    if (authorId) {
        bookQuery.where({
            authors: {
                some: {
                    authorId: Number(authorId),
                },
            },
        });
    }
    // ── Publisher filter ───────────────────────────────────────────────────────
    const rawPublisher = publisher !== null && publisher !== void 0 ? publisher : publishers;
    if (rawPublisher) {
        const publisherValues = Array.isArray(rawPublisher)
            ? rawPublisher.flatMap((p) => p.split(',')).map((p) => p.trim()).filter(Boolean)
            : typeof rawPublisher === 'string'
                ? rawPublisher.split(',').map((p) => p.trim()).filter(Boolean)
                : [];
        if (publisherValues.length === 1) {
            bookQuery.where({
                publisher: {
                    name: { contains: publisherValues[0], mode: 'insensitive' },
                },
            });
        }
        else if (publisherValues.length > 1) {
            bookQuery.where({
                OR: publisherValues.map((p) => ({
                    publisher: {
                        name: { contains: p, mode: 'insensitive' },
                    },
                })),
            });
        }
    }
    if (publisherId) {
        bookQuery.where({
            publisherId: Number(publisherId),
        });
    }
    // ── Price range filter ─────────────────────────────────────────────────────
    const minPriceNum = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
    const maxPriceNum = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
    if (minPriceNum !== null && !isNaN(minPriceNum) && maxPriceNum !== null && !isNaN(maxPriceNum)) {
        bookQuery.where({ sellPrice: { gte: minPriceNum, lte: maxPriceNum } });
    }
    else if (minPriceNum !== null && !isNaN(minPriceNum)) {
        bookQuery.where({ sellPrice: { gte: minPriceNum } });
    }
    else if (maxPriceNum !== null && !isNaN(maxPriceNum)) {
        bookQuery.where({ sellPrice: { lte: maxPriceNum } });
    }
    // ── Type and Capability filters ────────────────────────────────────────────
    if (type) {
        bookQuery.where({ type });
    }
    const isBorrowableBool = isBorrowable === true || isBorrowable === 'true'
        ? true
        : isBorrowable === false || isBorrowable === 'false'
            ? false
            : undefined;
    const isSellableBool = isSellable === true || isSellable === 'true'
        ? true
        : isSellable === false || isSellable === 'false'
            ? false
            : undefined;
    if (isBorrowableBool === true) {
        bookQuery.where({
            type: {
                in: [client_1.BookType.BORROW_ONLY, client_1.BookType.HYBRID],
            },
        });
    }
    else if (isBorrowableBool === false) {
        bookQuery.where({
            type: client_1.BookType.SELL_ONLY,
        });
    }
    if (isSellableBool === true) {
        bookQuery.where({
            type: {
                in: [client_1.BookType.SELL_ONLY, client_1.BookType.HYBRID],
            },
        });
    }
    else if (isSellableBool === false) {
        bookQuery.where({
            type: client_1.BookType.BORROW_ONLY,
        });
    }
    // Custom Sorting Logic
    if (sortBy === 'createdAt') {
        bookQuery.orderBy({
            createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
        });
    }
    else if (sortBy) {
        bookQuery.orderBy({
            [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
        });
    }
    else {
        bookQuery.orderBy({
            createdAt: 'desc',
        });
    }
    bookQuery.include({
        publisher: true,
        authors: {
            include: {
                author: true,
            },
        },
    });
    const result = yield bookQuery.execute();
    return {
        meta: result.meta,
        data: result.data.map(exports.formatBookResponse),
    };
});
const getBookByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id },
        include: {
            publisher: true,
            authors: {
                include: {
                    author: true,
                },
            },
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
    return (0, exports.formatBookResponse)(Object.assign(Object.assign({}, book), { totalReviews,
        averageRating }));
});
const updateBookInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingBook = yield db_1.default.book.findUnique({
        where: { id },
    });
    if (!existingBook) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    if (payload.isbn && payload.isbn !== existingBook.isbn) {
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
    // Handle categories
    if (payload.categories !== undefined) {
        const cats = Array.from(new Set(payload.categories.map((c) => c.trim()).filter(Boolean)));
        updateData.categories = cats;
        updateData.category = cats.join(', ');
    }
    else if (payload.category !== undefined) {
        updateData.category = payload.category;
        updateData.categories = payload.category.split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (payload.isbn !== undefined)
        updateData.isbn = payload.isbn;
    if (payload.locationCell !== undefined)
        updateData.locationCell = payload.locationCell;
    // Handle Publisher
    if (payload.publisherId !== undefined || payload.publisher !== undefined) {
        updateData.publisherId = yield resolvePublisherId(payload.publisherId, payload.publisher);
    }
    if (payload.pages !== undefined)
        updateData.pages = Number(payload.pages);
    if (payload.type !== undefined)
        updateData.type = payload.type;
    if (payload.buyPrice !== undefined)
        updateData.buyPrice = payload.buyPrice !== null ? Number(payload.buyPrice) : null;
    if (payload.sellPrice !== undefined)
        updateData.sellPrice = payload.sellPrice !== null ? Number(payload.sellPrice) : null;
    // Handle custom discount
    if (payload.customDiscount !== undefined) {
        updateData.customDiscount = payload.customDiscount !== null ? Number(payload.customDiscount) : null;
    }
    else if (payload.discount !== undefined) {
        updateData.customDiscount = payload.discount !== null ? Number(payload.discount) : null;
    }
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
    // Handle Authors
    if (payload.authors !== undefined || payload.author !== undefined) {
        const resolvedAuthors = yield resolveAuthorItems(payload.authors, payload.author);
        yield db_1.default.bookAuthor.deleteMany({ where: { bookId: id } });
        if (resolvedAuthors.length > 0) {
            yield db_1.default.bookAuthor.createMany({
                data: resolvedAuthors.map((a) => ({
                    bookId: id,
                    authorId: a.authorId,
                    role: a.role,
                })),
                skipDuplicates: true,
            });
        }
    }
    const updated = yield db_1.default.book.update({
        where: { id },
        data: updateData,
        include: {
            publisher: true,
            authors: {
                include: {
                    author: true,
                },
            },
        },
    });
    return (0, exports.formatBookResponse)(updated);
});
const deleteBookFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const book = yield db_1.default.book.findUnique({
        where: { id },
    });
    if (!book) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Book not found!');
    }
    return yield db_1.default.book.delete({
        where: { id },
    });
});
const getBookCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const books = yield db_1.default.book.findMany({
        where: { isArchived: false },
        select: {
            id: true,
            title: true,
            coverImage: true,
            category: true,
            categories: true,
            authors: {
                include: {
                    author: true,
                },
            },
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const categoryMap = new Map();
    for (const book of books) {
        const cats = new Set();
        if (Array.isArray(book.categories) && book.categories.length > 0) {
            book.categories.forEach((c) => {
                const trimmed = c === null || c === void 0 ? void 0 : c.trim();
                if (trimmed)
                    cats.add(trimmed);
            });
        }
        if (book.category) {
            book.category.split(',').forEach((c) => {
                const trimmed = c === null || c === void 0 ? void 0 : c.trim();
                if (trimmed)
                    cats.add(trimmed);
            });
        }
        const authorStr = book.authors.map((ba) => { var _a; return (_a = ba.author) === null || _a === void 0 ? void 0 : _a.name; }).filter(Boolean).join(', ') || 'Unknown';
        const previewBook = {
            id: book.id,
            title: book.title,
            coverImage: book.coverImage,
            author: authorStr,
        };
        cats.forEach((cat) => {
            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, { category: cat, books: [] });
            }
            categoryMap.get(cat).books.push(previewBook);
        });
    }
    return Array.from(categoryMap.values())
        .map((item) => ({
        category: item.category,
        count: item.books.length,
        books: item.books.slice(0, 4),
    }))
        .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
});
const getBookOptionsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const [categoriesRaw, locationCellsRaw, publishers, authors] = yield Promise.all([
        db_1.default.book.findMany({
            where: { isArchived: false },
            select: { category: true, categories: true },
        }),
        db_1.default.book.findMany({
            where: { isArchived: false },
            select: { locationCell: true },
        }),
        db_1.default.publisher.findMany({
            select: { id: true, name: true, defaultDiscount: true, logo: true },
            orderBy: { name: 'asc' },
        }),
        db_1.default.author.findMany({
            select: { id: true, name: true, avatar: true, authorDesignation: true },
            orderBy: { name: 'asc' },
        }),
    ]);
    const categoriesSet = new Set();
    categoriesRaw.forEach((b) => {
        if (Array.isArray(b.categories))
            b.categories.forEach((c) => c && categoriesSet.add(c.trim()));
        if (b.category)
            b.category.split(',').forEach((c) => c && categoriesSet.add(c.trim()));
    });
    const locationCellsSet = new Set();
    locationCellsRaw.forEach((b) => {
        if (b.locationCell && b.locationCell !== 'Rack-Unassigned' && b.locationCell !== 'Cell-Unassigned') {
            locationCellsSet.add(b.locationCell.trim());
        }
    });
    return {
        categories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b)),
        locationCells: Array.from(locationCellsSet).sort((a, b) => a.localeCompare(b)),
        publishers: publishers.map((p) => p.name),
        publisherList: publishers,
        authors: authors.map((a) => ({ id: a.id, name: a.name, role: 'WRITER' })),
        authorList: authors,
    };
});
exports.BookService = {
    createBookIntoDB,
    getAllBooksFromDB,
    getBookByIdFromDB,
    getBookCategoriesFromDB,
    getBookOptionsFromDB,
    updateBookInDB,
    deleteBookFromDB,
};
